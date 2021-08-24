import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Reservation } from './entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { CreateReservationInput, CreateReservationOutput } from './dtos/createReservation.dto';
import { GetReservationInput, GetReservationOutput } from './dtos/getReservation.dto';
import { DeleteReservationInput } from './dtos/deleteReservation.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { UserRole } from '../users/entities/users.constants';
import { GetMyReservationOutput } from './dtos/getMyReservation.dto';
import { AVAILABLE_ROOMS, PUB_SUB } from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation) private readonly RRepository: Repository<Reservation>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  // 예약하기
  async createReservation(user: User, createRestaurantInput: CreateReservationInput): Promise<CreateReservationOutput> {
    try {
      const reservation = this.RRepository.create(createRestaurantInput);
      reservation.host = user;

      await this.RRepository.save(reservation);
      for (const p of reservation.participantIds) {
        const parti = await this.userRepository.findOne(p);
        if (!reservation.participants) {
          reservation.participants = [];
        }
        reservation.participants.push(parti);
      }

      await this.availableRoomsScheduler();
      return { ok: true, reservation };
    } catch (err) {
      return { ok: false, error: "Couldn't create a reservation" };
    }
  }

  // 각 회의실 예약 조회
  // 오늘의 기준으로 1년 전 데이터 까지
  // 1년 이전 데이터는 삭제
  async getReservation({ roomId }: GetReservationInput): Promise<GetReservationOutput> {
    try {
      const reservations = await this.RRepository.find({
        where: {
          roomId,
        },
        relations: ['host'],
      });

      for (const i of reservations) {
        for (const p of i.participantIds) {
          const parti = await this.userRepository.findOne(p);
          if (!i.participants) {
            i.participants = [];
          }
          i.participants.push(parti);
        }
      }

      return { ok: true, reservations };
    } catch (err) {
      console.log(err);
      return { ok: false, error: "Couldn't get reservations" };
    }
  }

  // 예약 삭제
  async deleteReservation(user: User, { id }: DeleteReservationInput): Promise<CoreOutput> {
    try {
      const reservation = await this.RRepository.findOne(id, { relations: ['host'] });
      if (!reservation) {
        return { ok: false, error: 'Reservation not found' };
      }

      let flag = true;
      if (reservation.host.id !== user.id) {
        flag = false;
      }
      if (user.role == UserRole.Admin) {
        flag = true;
      }

      if (!flag) {
        return { ok: false, error: 'Authentication error' };
      }

      await this.RRepository.delete(id);
      await this.availableRoomsScheduler();

      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Couldn't delete a reservation" };
    }
  }

  // 나의 예약 확인
  async getMyReservation(user: User): Promise<GetMyReservationOutput> {
    try {
      const reservations = await this.RRepository.find({ where: { host: user } });

      return { ok: true, reservations };
    } catch (err) {
      console.log(err);
      return { ok: false, error: "Couldn't get my reservations" };
    }
  }

  // 현재시간 기준 예약된 회의실 모두 조회
  async getAvailableRooms(): Promise<GetReservationOutput> {
    try {
      const reservations = await this.getRooms();
      if (!reservations) {
        throw new Error();
      }

      return { ok: true, reservations };
    } catch (err) {
      console.log(err);
      return { ok: false, error: "Couldn't get reservations" };
    }
  }

  @Cron('*/30 * * * *')
  async availableRoomsScheduler() {
    try {
      const reservations = await this.getRooms();
      if (!reservations) {
        return;
      }

      await this.pubSub.publish(AVAILABLE_ROOMS, reservations);
    } catch (err) {
      console.log(err);
    }
  }

  async getRooms(): Promise<Reservation[]> {
    try {
      const reservations = await this.RRepository.find({
        where: {
          startAt: Raw((startAt) => `${startAt} < timestamp :today`, { today: new Date() }),
          endAt: Raw((endAt) => `${endAt} > timestamp :today`, { today: new Date() }),
        },
        relations: ['host'],
      });

      for (const i of reservations) {
        for (const p of i.participantIds) {
          const parti = await this.userRepository.findOne(p);
          if (!i.participants) {
            i.participants = [];
          }
          i.participants.push(parti);
        }
      }
      return reservations;
    } catch (err) {
      return;
    }
  }
  //TODO 예약 시간 변경
}
