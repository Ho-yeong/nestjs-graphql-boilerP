import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Between, MoreThan, Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { DoWorkInput, DoWorkOutput } from './dtos/doWork.dto';
import { RequestInput, RequestOutput } from './dtos/request.dto';
import { ModifyVacationInput, ModifyVacationOutput } from './dtos/modifyVacation.dto';
import { GetUserWorkTimeInput, GetUserWorkTimeOutput } from './dtos/getUserWorkTime.dto';
import { User } from '../users/entities/user.entity';
import { VacationEnum, WorkType } from './entities/request.constant';
import { GetRequestListOutput } from '../common/dtos/getRequestList.dto';
import { RequestCheckInput, RequestCheckOutput } from './dtos/requestCheck.dto';
import { BotService } from '../bot/bot.service';
import * as moment from 'moment-timezone';
import { Vacation } from './entities/vacation.entity';
import {
  AttendanceMonthlyData,
  GetUserMonthlyWorkInput,
  GetUserMonthlyWorkOutput,
} from './dtos/getUserMonthlyWork.dto';
import { UserRole } from '../users/entities/users.constants';
import { GwangHo, Jimin, Sua } from '../bot/bot.constant';
import { GetAllVacationInput, GetAllVacationOutput } from './dtos/getAllVacation.dto';
import { DeleteVacationInput, DeleteVacationOutput } from './dtos/deleteVacation.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private readonly ARepo: Repository<Attendance>,
    @InjectRepository(Request) private readonly RRepo: Repository<Request>,
    @InjectRepository(User) private readonly URepo: Repository<User>,
    @InjectRepository(Vacation) private readonly VRepo: Repository<Vacation>,
    private readonly botService: BotService,
  ) {}

  // 유저 정보 조회 -> 일주일, 한달, 사용한 연차
  async getUserWorkTime({ userId }: GetUserWorkTimeInput): Promise<GetUserWorkTimeOutput> {
    try {
      const user = await this.URepo.findOne(userId);
      if (!user) {
        return { ok: false, error: 'There is no user information' };
      }
      const today = new Date();
      const thisMonth = new Date(`${today.getFullYear()}-${today.getMonth() + 1}`);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      // 이번주 월요일
      const mon = moment(today).startOf('isoWeek');
      const monDate = mon.toDate().getDate();
      // 이번주 일요일
      const sun = mon.add(6, 'days');
      const sunDate = sun.toDate().getDate();

      // 한달
      const data = await this.ARepo.find({
        where: {
          workStart: MoreThan(thisMonth),
          userId,
        },
      });

      const vacationData = await this.VRepo.find({
        where: {
          date: MoreThan(thisMonth),
          userId,
        },
      });

      let weekly = 0;
      let monthlyTime = 0;
      let todayWork;
      for (let i = 1; i <= lastDay; i++) {
        let workTime = 0;

        const vData = vacationData.find((v) => v.date.getDate() === i);

        let vacationWorkTime = 4;
        if (vData) {
          if (vData.type === VacationEnum.DayOff) {
            vacationWorkTime = 8;
          }
        }

        const dayData = data.find((v) => v.workStart.getDate() === i);
        if (dayData) {
          if (dayData.workEnd) {
            const t1 = moment(dayData.workEnd);
            const t2 = moment(dayData.workStart);
            const diff = moment.duration(t1.diff(t2)).asHours();
            workTime = Math.ceil(diff - 2) < 0 ? 0 : Math.ceil(diff - 2);
          }
        }
        if (today.getDate() === i) {
          todayWork = dayData;
        }
        if (i >= monDate && i <= sunDate) {
          weekly += workTime;
          if (vData) {
            weekly += vacationWorkTime;
          }
        }
        monthlyTime += workTime;
        if (vData) {
          monthlyTime += vacationWorkTime;
        }
      }

      return { ok: true, vacation: user.vacation, totalVacation: user.totalVacation, weekly, monthlyTime, todayWork };
    } catch (error) {
      return { ok: false, error: 'Get user information failed' };
    }
  }

  async getUserMonthlyWork({ userId, month, year }: GetUserMonthlyWorkInput): Promise<GetUserMonthlyWorkOutput> {
    try {
      const user = await this.URepo.findOne(userId);
      if (!user) {
        return { ok: false, error: 'There is no user information' };
      }
      const targetMonth = new Date(`${year}-${month}`);
      const lastDay = new Date(year, month, 0).getDate();
      const targetMonthLastDay = new Date(`${year}-${month}-${lastDay}`);

      const data = await this.ARepo.find({
        where: {
          workStart: Between(targetMonth, targetMonthLastDay),
          userId,
        },
      });

      const vacationData = await this.VRepo.find({
        where: {
          date: Between(targetMonth, targetMonthLastDay),
          userId,
        },
      });

      const monthly: AttendanceMonthlyData[] = [];

      for (let i = 1; i <= lastDay; i++) {
        const tmp = new AttendanceMonthlyData();
        tmp.name = `${i}`;
        tmp.workTime = 0;
        const dayData = data.find((v) => v.workStart.getDate() === i);
        const vData = vacationData.find((v) => v.date.getDate() === i);

        if (vData) {
          let vacationWorkTime = 4;
          if (vData.type === VacationEnum.DayOff) {
            vacationWorkTime = 8;
          }
          tmp.vacation = vacationWorkTime;
        }

        if (dayData) {
          if (dayData.workEnd) {
            let mealTime = 2;
            // 점심시간
            if (
              dayData.workStart >
              moment(
                new Date(
                  `${dayData.workStart.getFullYear()}-${
                    dayData.workStart.getMonth() + 1
                  }-${dayData.workStart.getDate()} 14:00:00`,
                ),
              ).toDate()
            ) {
              mealTime = 1;
            }

            const t1 = moment(dayData.workEnd);
            const t2 = moment(dayData.workStart);
            const diff = moment.duration(t1.diff(t2)).asHours();
            const result = Math.ceil(diff - mealTime);
            tmp.workTime = result < 0 ? 0 : result;
          }
        }
        monthly.push(tmp);
      }

      return { ok: true, monthly };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Get user information failed' };
    }
  }

  // 출근, 퇴근 하기
  async doWork({ userId, workType }: DoWorkInput): Promise<DoWorkOutput> {
    try {
      const user = await this.URepo.findOne(userId);
      if (!user) {
        return { ok: false, error: 'There is no user information' };
      }
      // 오늘 기준으로 출퇴근 기록 조회해서 있으면 재입력 못하게 처리

      if (workType === WorkType.START) {
        await this.ARepo.insert(
          this.ARepo.create({
            userId,
            workStart: new Date(),
          }),
        );

        await this.botService.sendMessageByEmail(user.email, `${user.name}님, 오늘도 화이팅하세요 😍`);
      } else {
        const today = new Date();
        const thisDay = new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} 00:00:00`);

        await this.ARepo.update(
          { userId, workStart: MoreThan(thisDay) },
          {
            workEnd: new Date(),
          },
        );
        await this.botService.sendMessageByEmail(user.email, `${user.name}님, 오늘도 고생하셨습니다. 🚗`);
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Work progress failed' };
    }
  }

  // 리퀘스트 리스트
  async getRequestList(): Promise<GetRequestListOutput> {
    try {
      const requests = await this.RRepo.find({
        where: {
          check: false,
        },
        relations: ['user'],
      });

      return { ok: true, requests };
    } catch (error) {
      return { ok: false, error: 'Load request list failed' };
    }
  }

  // 리퀘스트 체크
  async requestCheck({ id, confirm }: RequestCheckInput, user: User): Promise<RequestCheckOutput> {
    try {
      const request = await this.RRepo.findOne(id);
      if (!request) {
        return { ok: false, error: 'There is no request information' };
      }
      const targetUser = await this.URepo.findOne(request.userId);
      if (!targetUser) {
        return { ok: false, error: 'There is no user information' };
      }

      let textBlock = '출근시간';

      if (!confirm) {
        await this.RRepo.delete(id);
        await this.botService.sendMessageByEmail(
          targetUser.email,
          `${targetUser.name}님의 ${textBlock} 수정 요청이 ${user.name}님에 의해 거절되었습니다. 👍`,
        );
        await this.RRepo.update(id, {
          check: true,
        });
        return { ok: true };
      }

      if (request.workType === WorkType.START) {
        await this.ARepo.update(request.attendanceId, {
          workStart: request.workTime,
        });
      } else {
        await this.ARepo.update(request.attendanceId, {
          workEnd: request.workTime,
        });
        textBlock = '퇴근시간';
      }

      await this.RRepo.update(id, {
        check: true,
      });

      await this.botService.sendMessageByEmail(
        targetUser.email,
        `${targetUser.name}님의 ${textBlock} 수정 요청이 ${user.name}님에 의해 처리되었습니다. 👍`,
      );

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Request Check failed' };
    }
  }

  // 출, 퇴근 시간 수정 리퀘스트
  async request({ userId, workType, workTime, reason }: RequestInput): Promise<RequestOutput> {
    try {
      const user = await this.URepo.findOne(userId);
      if (!user) {
        return { ok: false, error: 'There is no user information' };
      }

      const targetDayStart = moment(
        `${workTime.getFullYear()}-${workTime.getMonth() + 1}-${workTime.getDate()} 00:00:00`,
      );
      const targetDayEnd = moment(
        `${workTime.getFullYear()}-${workTime.getMonth() + 1}-${workTime.getDate()} 23:59:59`,
      );

      const attendance = await this.ARepo.findOne({
        where: {
          workStart: Between(targetDayStart.toDate(), targetDayEnd.toDate()),
          userId,
        },
      });
      console.log(userId);
      console.log(attendance);
      if (!attendance) {
        return { ok: false, error: 'Wrong Access! 관리자에게 문의하세요' };
      }

      await this.RRepo.insert(
        this.RRepo.create({
          userId,
          user,
          attendanceId: attendance.id,
          workType,
          workTime,
          reason,
        }),
      );

      let text = '출근시간';
      if (workType === WorkType.END) {
        text = ` 퇴근시간`;
      }

      await this.botService.sendMessageByEmail(GwangHo, `${user.name}님에게서 ${text} 수정요청이 왔습니다.`);
      await this.botService.sendMessageByEmail(Sua, `${user.name}님에게서 ${text} 수정요청이 왔습니다.`);
      await this.botService.sendMessageByEmail(Jimin, `${user.name}님에게서 ${text} 수정요청이 왔습니다.`);
      await this.botService.sendMessageByEmail(user.email, `${text} 수정요청을 정상적으로 보냈습니다. 🤷‍♂️`);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Request send failed' };
    }
  }

  // 연차, 반차 수정
  async modifyVacation({ userId, type, date }: ModifyVacationInput, authUser: User): Promise<ModifyVacationOutput> {
    if (authUser.role !== UserRole.Admin) {
      return { ok: false, error: 'Access denied' };
    }

    try {
      const user = await this.URepo.findOne(userId);
      if (!user) {
        return { ok: false, error: 'There is no user information' };
      }

      let num = 0.5;
      let typeText = '';

      switch (type) {
        case VacationEnum.DayOff:
          num = 1;
          typeText = '연차';
          break;
        case VacationEnum.AMOff:
          typeText = '오전 반차';
          break;
        case VacationEnum.PMOff:
          typeText = '오후 반차';
          break;
      }
      const data = await this.VRepo.findOne({
        where: {
          userId,
          date,
        },
      });

      if (data) {
        if (
          (data.type === VacationEnum.AMOff && type === VacationEnum.DayOff) ||
          (data.type === VacationEnum.PMOff && type === VacationEnum.DayOff)
        ) {
          await this.URepo.update(userId, {
            vacation: () => `vacation + 0.5`,
          });
        } else if (
          (data.type === VacationEnum.DayOff && type === VacationEnum.AMOff) ||
          (data.type === VacationEnum.DayOff && type === VacationEnum.PMOff)
        ) {
          await this.URepo.update(userId, {
            vacation: () => `vacation - 0.5`,
          });
        }

        await this.VRepo.update(data.id, { date, type });

        await this.botService.sendMessageByEmail(
          user.email,
          `${moment(date).format('MM월 DD일')} ${typeText}가 처리되었습니다. 👍`,
        );

        await this.botService.sendMessageByEmail(
          authUser.email,
          `[${moment(date).format('MM월 DD일')}] ${user.name}님의 ${typeText}를 처리하셨습니다. 👍`,
        );

        return { ok: true, error: String(data.type), id: data.id };
      } else {
        await this.URepo.update(userId, {
          vacation: () => `vacation + ${num}`,
        });

        await this.botService.sendMessageByEmail(
          user.email,
          `${moment(date).format('MM월 DD일')} ${typeText}가 처리되었습니다. 🤗`,
        );

        await this.botService.sendMessageByEmail(
          authUser.email,
          `[${moment(date).format('MM월 DD일')}]${user.name}님의 ${typeText}를 처리하셨습니다. 👍`,
        );

        const result = await this.VRepo.insert(this.VRepo.create({ userId, type, date }));
        return { ok: true, id: result.raw.insertId };
      }
    } catch (error) {
      return { ok: false, error: 'vacation modify failed' };
    }
  }

  async getAllVacations({ userId, month, year }: GetAllVacationInput): Promise<GetAllVacationOutput> {
    try {
      const targetMonth = new Date(`${year}-${month}-01 00:00:00`);
      const lastDay = new Date(year, month, 0).getDate();
      const targetMonthLastDay = new Date(`${year}-${month}-${lastDay}`);

      const vacations = await this.VRepo.find({
        where: {
          date: Between(targetMonth, targetMonthLastDay),
          userId,
        },
        order: {
          date: 'DESC',
        },
      });

      return { ok: true, vacations };
    } catch (error) {
      return { ok: false, error: "Get user's vacations failed" };
    }
  }

  async deleteVacation({ id }: DeleteVacationInput): Promise<DeleteVacationOutput> {
    try {
      const vacation = await this.VRepo.findOne(id);
      if (!vacation) {
        return { ok: false, error: 'There is no vacation info' };
      }

      await this.VRepo.delete(id);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Delete user's vacation info failed" };
    }
  }
}
