import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, LessThan, MoreThan } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Reservation } from './entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { CreateReservationInput, CreateReservationOutput } from './dtos/createReservation.dto';
import { GetReservationInput, GetReservationOutput } from './dtos/getReservation.dto';
import { DeleteReservationInput } from './dtos/deleteReservation.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { UserRole } from '../users/entities/users.constants';
import { GetMyReservationOutput } from './dtos/getMyReservation.dto';
import { AVAILABLE_ROOMS, PUB_SUB, TODAY_ROOMS } from '../common/common.constants';
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
      const startTimeCheck = await this.RRepository.find({
        where: {
          roomId: createRestaurantInput.roomId,
          startAt: Raw((startAt) => `${startAt} < timestamp :startTime`, {
            startTime: createRestaurantInput.startAt,
          }),
          endAt: Raw((endAt) => `${endAt} > timestamp :startTime`, {
            startTime: createRestaurantInput.startAt,
          }),
        },
      });

      if (startTimeCheck.length > 0) {
        return { ok: false, error: 'startTime' };
      }

      const endTimeCheck = await this.RRepository.find({
        where: {
          roomId: createRestaurantInput.roomId,
          startAt: Raw((startAt) => `${startAt} < timestamp :endTime`, {
            endTime: createRestaurantInput.endAt,
          }),
          endAt: Raw((endAt) => `${endAt} > timestamp :endTime`, {
            endTime: createRestaurantInput.endAt,
          }),
        },
      });

      if (endTimeCheck.length > 0) {
        return { ok: false, error: 'endTime' };
      }

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
      await this.getTodayReservationsScheduler();
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
      await this.getTodayReservationsScheduler();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Couldn't delete a reservation" };
    }
  }

  // 오늘 날짜 기준 모든 회의실 예약 조회
  async getTodayReservations(): Promise<GetReservationOutput> {
    try {
      const reservations = await this.getTodayRooms();
      if (!reservations) {
        return { ok: false };
      }

      return { ok: true, reservations };
    } catch (err) {
      console.log(err);
      return { ok: false, error: "Couldn't get reservations" };
    }
  }

  async getTodayReservationsScheduler() {
    try {
      const reservations = await this.getTodayRooms();
      if (!reservations) {
        return;
      }

      await this.pubSub.publish(TODAY_ROOMS, reservations);
    } catch (err) {
      console.log(err);
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
      const reservations = await this.getCurrentRooms();
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
      const reservations = await this.getCurrentRooms();
      if (!reservations) {
        return;
      }

      await this.pubSub.publish(AVAILABLE_ROOMS, reservations);
    } catch (err) {
      console.log(err);
    }
  }

  async getCurrentRooms(): Promise<Reservation[]> {
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
  async getTodayRooms(): Promise<Reservation[]> {
    const today = new Date();
    const utc = today.getTime() + today.getTimezoneOffset() * 60 * 1000;

    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const kr_curr = new Date(utc + KR_TIME_DIFF);

    try {
      const reservations = await this.RRepository.find({
        where: {
          startAt: MoreThan(`${kr_curr.getFullYear()}-${kr_curr.getMonth() + 1}-${kr_curr.getDate()} 07:00:00`),
          endAt: LessThan(`${kr_curr.getFullYear()}-${kr_curr.getMonth() + 1}-${kr_curr.getDate()} 23:59:59`),
        },
        relations: ['host'],
      });
      console.log(reservations);

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
