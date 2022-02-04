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
import { PUB_SUB } from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { EditReservationInput } from './dtos/editReservation.dto';
import { BotService } from '../bot/bot.service';
import { RoomsEnum } from './entities/reservation.constant';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation) private readonly RRepository: Repository<Reservation>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
    private readonly botService: BotService,
  ) {}

  // 예약하기
  async createReservation(
    user: User,
    { msg, endAt, title, content, startAt, roomId, participantIds }: CreateReservationInput,
  ): Promise<CreateReservationOutput> {
    // TODO 임시 처리 5월까지 회의실 사용 금지
    if (roomId === RoomsEnum.Room3) {
      return { ok: false, error: '5월 말까지 사운드 작업으로 이용 중' };
    }

    try {
      const startTimeCheck = await this.RRepository.find({
        where: {
          roomId,
          startAt: Raw((startAt) => `${startAt} < timestamp :startAt`, {
            startAt,
          }),
          endAt: Raw((endAt) => `${endAt} > timestamp :startAt`, {
            startAt,
          }),
        },
      });

      if (startTimeCheck.length > 0) {
        return { ok: false, error: 'startTime' };
      }

      const endTimeCheck = await this.RRepository.find({
        where: {
          roomId,
          startAt: Raw((startAt) => `${startAt} < timestamp :endAt`, {
            endAt,
          }),
          endAt: Raw((endAt) => `${endAt} > timestamp :endAt`, {
            endAt,
          }),
        },
      });

      if (endTimeCheck.length > 0) {
        return { ok: false, error: 'endTime' };
      }

      const reservation = this.RRepository.create({
        roomId,
        participantIds,
        startAt,
        endAt,
        title,
        host: user,
        content,
      });

      await this.RRepository.save(reservation);
      reservation.participants = [];
      for (const p of reservation.participantIds) {
        const parti = await this.userRepository.findOne(p);
        if (parti) {
          reservation.participants.push(parti);
        }
      }

      if (msg) {
        let roomName = '';
        switch (roomId) {
          case RoomsEnum.Room1:
            roomName = 'A동 6인';
            break;
          case RoomsEnum.Room2:
            roomName = 'A동 8인';
            break;
          // case RoomsEnum.Room3:
          //   roomName = 'B동 4인';
          //   break;
          case RoomsEnum.Room4:
            roomName = 'B동 대회의실';
            break;
        }

        const msgData = this.botService.makeReservationMsg(roomName, title, user, reservation.participants, startAt);
        await this.botService.sendReservationMsgByEmail(user.email, msgData);
        for (const p of reservation.participants) {
          await this.botService.sendReservationMsgByEmail(p.email, msgData);
        }
      }

      return { ok: true, reservation };
    } catch (err) {
      console.log(err);
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

      return { ok: true, reservations: await this.putParticipants(reservations) };
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
  //
  // @Cron('*/30 * * * *')
  // async availableRoomsScheduler() {
  //   try {
  //     const reservations = await this.getCurrentRooms();
  //     if (!reservations) {
  //       return;
  //     }
  //
  //     await this.pubSub.publish(AVAILABLE_ROOMS, reservations);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  async getCurrentRooms(): Promise<Reservation[]> {
    try {
      const reservations = await this.RRepository.find({
        where: {
          startAt: Raw((startAt) => `${startAt} < timestamp :today`, { today: new Date() }),
          endAt: Raw((endAt) => `${endAt} > timestamp :today`, { today: new Date() }),
        },
        relations: ['host'],
      });

      return this.putParticipants(reservations);
    } catch (err) {
      return;
    }
  }

  async putParticipants(reservations: Reservation[]): Promise<Reservation[]> {
    try {
      for (const i of reservations) {
        if (!i.participants) {
          i.participants = [];
        }
        for (const p of i.participantIds) {
          const parti = await this.userRepository.findOne(p);
          if (parti) {
            i.participants.push(parti);
          }
        }
      }
      return reservations;
    } catch (error) {
      console.log(error);
    }
  }

  async getTodayRooms(): Promise<Reservation[]> {
    const today = new Date();
    // 저번 달 마지막 일
    // 저번달이 작년 12월 일 경우 12월의 마지막일
    const lastMonthLastDay = new Date(
      today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear(),
      today.getMonth() === 0 ? 12 : today.getMonth() + 1,
      0,
    ).getDate();

    // 년
    const startYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    // 월
    const startMonth =
      // 작년일때는 12월, 날짜가 저번달로 넘어갈때는 저번달, 아닐경우는 이번달
      startYear !== today.getFullYear() ? 12 : today.getDate() - 7 <= 0 ? today.getMonth() : today.getMonth() + 1;
    // 일
    const startDay = today.getDate() - 7 <= 0 ? lastMonthLastDay - -(today.getDate() - 7) : today.getDate() - 7;

    // 이번달 마지막 일
    const thisMonthLastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    // 년
    const endYear = today.getMonth() + 2 === 13 ? today.getFullYear() + 1 : today.getFullYear();
    // 월
    const endMonth =
      today.getDate() + 7 > thisMonthLastDay
        ? today.getMonth() + 2 === 13
          ? 1
          : today.getMonth() + 2
        : today.getMonth() + 1;
    // 일
    const endDay =
      today.getDate() + 7 > thisMonthLastDay ? today.getDate() + 7 - thisMonthLastDay : today.getDate() + 7;

    try {
      const reservations = await this.RRepository.find({
        where: {
          startAt: MoreThan(new Date(`${startYear}-${startMonth}-${startDay} 08:59:59`)),
          endAt: LessThan(new Date(`${endYear}-${endMonth}-${endDay} 00:00:00`)),
        },
        relations: ['host'],
      });

      return this.putParticipants(reservations);
    } catch (err) {
      return;
    }
  }

  async editReservation(user: User, { id, startAt, endAt }: EditReservationInput): Promise<CoreOutput> {
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

      await this.RRepository.update(id, { startAt, endAt });

      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Couldn't modify a reservation" };
    }
  }
}
