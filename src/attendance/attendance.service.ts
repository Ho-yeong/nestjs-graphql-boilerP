import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Between, LessThan, MoreThan, Not, Raw, Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { DoWorkInput, DoWorkOutput } from './dtos/doWork.dto';
import { RequestInput, RequestOutput } from './dtos/request.dto';
import { ModifyVacationInput, ModifyVacationOutput } from './dtos/modifyVacation.dto';
import { GetUserWorkTimeInput, GetUserWorkTimeOutput } from './dtos/getUserWorkTime.dto';
import { User } from '../users/entities/user.entity';
import { RequestType, VacationEnum, WorkType } from './entities/request.constant';
import { GetRequestListOutput } from '../common/dtos/getRequestList.dto';
import { RequestCheckInput, RequestCheckOutput } from './dtos/requestCheck.dto';
import { BotService } from '../bot/bot.service';
import * as moment from 'moment-timezone';
import { Vacation } from './entities/vacation.entity';
import { AttendanceMonthlyData, GetUserMonthlyWorkInput, GetUserMonthlyWorkOutput } from './dtos/getMonthlyWork.dto';
import { UserRole, UserTeamRole } from '../users/entities/users.constants';
import { GetAllVacationInput, GetAllVacationOutput } from './dtos/getAllVacation.dto';
import { DeleteVacationInput, DeleteVacationOutput } from './dtos/deleteVacation.dto';
import { Cron } from '@nestjs/schedule';
import { DailyAverageProp, GetDailyAverageInput, GetDailyAverageOutput } from './dtos/getDailyAverage.dto';
import { ModifyAttendanceInput, ModifyAttendanceOutput } from './dtos/modifyAttendance.dto';
import { DeleteAttendanceInput, DeleteAttendanceOutput } from './dtos/deleteAttendance.dto';
import { GetMonthlyAverageInput, GetMonthlyAverageOutput, MonthlyAverageProp } from './dtos/getMonthlyAverage.dto';
import { GetWeeklyAverageInput, GetWeeklyAverageOutput } from './dtos/getWeeklyAverage.dto';
import { GetAllRequestsInput, GetAllRequestsOutput } from './dtos/getAllRequests.dto';
import { GetMyAttendanceInput, GetMyAttendanceOutput, MyAttendanceProp } from './dtos/getMyAttendance.dto';
import { GetMyRequestsInput, GetMyRequestsOutput } from './dtos/getMyRequests.dto';

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
      // 이번주 일요일
      const sun = moment(today).startOf('isoWeek').add(6, 'days');

      const m = moment(new Date(mon.toDate())).format('YYYY-MM-DD HH:mm:ss');
      const s = moment(new Date(sun.toDate())).format('YYYY-MM-DD HH:mm:ss');

      const WeekAttendanceData = await this.ARepo.find({
        where: {
          userId,
          workStart: Between(m, s),
        },
      });

      const WeekVacationData = await this.VRepo.find({
        where: {
          date: Between(m, s),
          userId,
        },
      });

      let weekly = 0;
      for (const i of WeekAttendanceData) {
        let workTime = 0;

        if (i.workEnd) {
          workTime = this.calcWorkTime(i.workStart, i.workEnd, i.dinner);
        }
        weekly += workTime;
      }

      for (const i of WeekVacationData) {
        let vacationTime = 4;
        if (i.type == VacationEnum.DayOff) {
          vacationTime = 8;
        } else if (i.type === VacationEnum.official || i.type === VacationEnum.halfOfficial) {
          vacationTime = 0;
        }
        weekly += vacationTime;
      }

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

      let monthlyTime = 0;
      for (let i = 1; i <= lastDay; i++) {
        let workTime = 0;

        const vData = vacationData.find((v) => v.date.getDate() === i);

        let vacationWorkTime = 4;
        if (vData) {
          if (vData.type === VacationEnum.DayOff) {
            vacationWorkTime = 8;
          } else if (vData.type === VacationEnum.official || vData.type === VacationEnum.halfOfficial) {
            vacationWorkTime = 0;
          }
        }

        const dayData = data.find((v) => v.workStart.getDate() === i);
        if (dayData) {
          if (dayData.workEnd) {
            workTime = this.calcWorkTime(dayData.workStart, dayData.workEnd, dayData.dinner);
          }
        }

        monthlyTime += workTime;
        if (vData) {
          monthlyTime += vacationWorkTime;
        }
      }
      const todayZero = new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} 05:30:01`);

      const todayWork =
        (await this.ARepo.findOne({
          where: {
            userId,
            workEnd: null,
          },
          order: {
            workStart: 'DESC',
          },
        })) ?? (await this.ARepo.findOne({ where: { userId, workEnd: MoreThan(todayZero) }, order: { id: 'DESC' } }));

      return {
        ok: true,
        vacation: user.vacation,
        totalVacation: user.totalVacation,
        weekly,
        monthlyTime,
        todayWork,
      };
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
      const targetMonthLastDay = new Date(`${year}-${month}-${lastDay} 23:59:59`);

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
          } else if (vData.type === VacationEnum.official || vData.type === VacationEnum.halfOfficial) {
            vacationWorkTime = 0;
          }
          tmp.vacation = vacationWorkTime;
        }

        if (dayData) {
          if (dayData.workEnd) {
            tmp.workTime = this.calcWorkTime(dayData.workStart, dayData.workEnd, dayData.dinner);
          }
        }
        monthly.push(tmp);
      }

      return { ok: true, monthly };
    } catch (error) {
      return { ok: false, error: 'Get user information failed' };
    }
  }

  calcWorkTime(workStart: Date, workEnd: Date, dinner: boolean): number {
    // 점심 시간
    let mealTime = 1;

    // 1시 이후로 출근 -> 점심시간 없음
    if (
      moment(workStart).toDate() >
      moment(
        new Date(`${workStart.getFullYear()}-${workStart.getMonth() + 1}-${workStart.getDate()} 13:00:00`),
      ).toDate()
    ) {
      mealTime -= 1;
    }

    // 저녁을 먹은 경우
    if (dinner) {
      mealTime += 1;
    }

    const t1 = moment(workEnd);
    const t2 = moment(workStart);
    const diff = moment.duration(t1.diff(t2)).asHours();
    let result = Math.floor(diff - mealTime);
    if (result > 14) {
      result = 0;
    }
    return result < 0 ? 0 : result;
  }

  // 출근, 퇴근 하기
  async doWork({ userId, workId, workType, dinner }: DoWorkInput): Promise<DoWorkOutput> {
    try {
      const user = await this.URepo.findOne(userId);
      if (!user) {
        return { ok: false, error: 'There is no user information' };
      }
      // 오늘 기준으로 출퇴근 기록 조회해서 있으면 재입력 못하게 처리

      const today = new Date();
      const workStartStandardTime = new Date(
        `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} 10:00:00`,
      );

      if (workType === WorkType.START) {
        await this.ARepo.insert(
          this.ARepo.create({
            userId,
            user,
            workStart: today < workStartStandardTime ? workStartStandardTime : today,
          }),
        );

        await this.botService.sendMessageByEmail(user.email, `${user.name}님, 오늘도 화이팅하세요 😍`);
      } else {
        const AData = await this.ARepo.findOne(workId);
        if (!AData) {
          return { ok: false, error: '출근 정보가 없습니다.' };
        }

        const limitDate = moment(AData.workStart).add(1, 'days').toDate();
        const limitTime = new Date(
          `${limitDate.getFullYear()}-${limitDate.getMonth() + 1}-${limitDate.getDate()} 02:00:00`,
        );

        await this.ARepo.update(workId, {
          workEnd: today > limitTime ? limitTime : today,
          dinner,
        });
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
          check: Raw((check) => `${check} = '0'`),
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
        await this.botService.sendMessageByEmail(
          targetUser.email,
          `${targetUser.name}님의 ${textBlock} 수정 요청이 ${user.name}님에 의해 거절되었습니다. 🤔`,
        );
        await this.RRepo.update(id, {
          check: RequestType.REJECTED,
        });
        return { ok: true };
      }

      if (request.attendanceId) {
        if (request.workType === WorkType.START) {
          await this.ARepo.update(request.attendanceId, {
            workStart: request.WillFixTime,
          });
        } else {
          await this.ARepo.update(request.attendanceId, {
            workEnd: request.WillFixTime,
          });
          textBlock = '퇴근시간';
        }
      } else {
        if (request.workType === WorkType.START) {
          await this.ARepo.insert(
            this.ARepo.create({
              userId: request.userId,
              workStart: request.WillFixTime,
            }),
          );
        } else {
          // 해당 날짜 출퇴근 기록이 없을떄, 출, 퇴근 리퀘스트를 둘 다 보낸 경우 -> 출근 리퀘스트 먼저 수락했을때 (반드시 출근 먼저 수락 해야함)
          const requestDay = `${request.workDate.getFullYear()}-${
            request.workDate.getMonth() + 1
          }-${request.workDate.getDate()}`;

          const min = new Date(`${requestDay} 00:00:00`);
          const max = new Date(`${requestDay} 23:59:59`);

          const attendance = await this.ARepo.findOne({
            where: {
              workStart: Between(min, max),
              userId: request.userId,
            },
          });
          if (attendance) {
            await this.ARepo.update(attendance.id, {
              workEnd: request.WillFixTime,
            });
          } else {
            return { ok: false, error: 'There is no work start record' };
          }
          textBlock = '퇴근시간';
        }
      }

      await this.RRepo.update(id, {
        check: RequestType.CONFIRMED,
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
  async request({ userId, workType, WillFixTime, workDate, reason }: RequestInput): Promise<RequestOutput> {
    try {
      const user = await this.URepo.findOne(userId);
      if (!user) {
        return { ok: false, error: 'There is no user information' };
      }

      const targetDayStart = new Date(
        `${workDate.getFullYear()}-${workDate.getMonth() + 1}-${workDate.getDate()} 00:00:00`,
      );
      const targetDayEnd = new Date(
        `${workDate.getFullYear()}-${workDate.getMonth() + 1}-${workDate.getDate()} 23:59:59`,
      );

      const attendance = await this.ARepo.findOne({
        where: {
          workStart: Between(targetDayStart, targetDayEnd),
          userId,
        },
      });

      await this.RRepo.insert(
        this.RRepo.create({
          userId,
          user,
          ...(attendance && { attendanceId: attendance.id }),
          workType,
          workDate,
          WillFixTime,
          reason,
          check: RequestType.WAITING,
        }),
      );

      let text = '출근시간';
      if (workType === WorkType.END) {
        text = ` 퇴근시간`;
      }

      // await this.botService.sendMessageByEmail(GwangHo, `${user.name}님에게서 ${text} 수정요청이 왔습니다.`);
      // await this.botService.sendMessageByEmail(Sua, `${user.name}님에게서 ${text} 수정요청이 왔습니다.`);
      // await this.botService.sendMessageByEmail(Jimin, `${user.name}님에게서 ${text} 수정요청이 왔습니다.`);

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
    // query 의 날짜가 현재의 날짜랑 다르면 false
    let yearFlag = true;

    const today = new Date();
    const thisYear = today.getFullYear();
    const queryYear = date.getFullYear();

    if (thisYear !== queryYear) {
      yearFlag = false;
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
        case VacationEnum.official:
          typeText = '공가';
          num = 0;
          break;
        case VacationEnum.halfOfficial:
          typeText = '반공가';
          num = 0;
          break;
      }
      const data = await this.VRepo.findOne({
        where: {
          userId,
          date,
        },
      });

      // 같은 날짜에 저장된 휴가가 있을때
      if (data) {
        // 저장되어 있던 휴가가 반차 이고 새로 받는 휴가가 연차일때 +0.5
        if (yearFlag) {
          if (
            (data.type === VacationEnum.AMOff && type === VacationEnum.DayOff) ||
            (data.type === VacationEnum.PMOff && type === VacationEnum.DayOff)
          ) {
            await this.URepo.update(userId, {
              vacation: () => `vacation + 0.5`,
            });
            // 저장되어 있던게 연차이고 새로 받는 휴가가 반차일때 -0.5
          } else if (
            (data.type === VacationEnum.DayOff && type === VacationEnum.AMOff) ||
            (data.type === VacationEnum.DayOff && type === VacationEnum.PMOff)
          ) {
            await this.URepo.update(userId, {
              vacation: () => `vacation - 0.5`,
            });
            // 저장되어 있던게 연차이고 새로 받는 휴가가 공가일때 -1
          } else if (
            data.type === VacationEnum.DayOff &&
            (type === VacationEnum.official || type === VacationEnum.halfOfficial)
          ) {
            await this.URepo.update(userId, {
              vacation: () => `vacation - 1`,
            });
            // 저장되어 있던게 반차이고 새로 받는 휴가가 공가일때 -0.5
          } else if (
            (data.type === VacationEnum.AMOff &&
              (type === VacationEnum.official || type === VacationEnum.halfOfficial)) ||
            (data.type === VacationEnum.PMOff && (type === VacationEnum.official || type === VacationEnum.halfOfficial))
          ) {
            await this.URepo.update(userId, {
              vacation: () => `vacation - 0.5`,
            });
          }
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
        // 기존 날짜에 저장된 휴가가 없을 때
      } else {
        if (yearFlag) {
          await this.URepo.update(userId, {
            vacation: () => `vacation + ${num}`,
          });
        }

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

  // 그래프 그릴때 사용
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
      let num = 0.5;
      if (vacation.type === VacationEnum.DayOff) {
        num = 1;
      } else if (vacation.type === VacationEnum.official || vacation.type === VacationEnum.halfOfficial) {
        num = 0;
      }

      await this.URepo.update(vacation.userId, {
        vacation: () => `vacation - ${num}`,
      });

      await this.VRepo.delete(id);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Delete user's vacation info failed" };
    }
  }

  @Cron('0 05 11 * * 1-5')
  async morningMessage() {
    try {
      const users = await this.URepo.find();

      const today = new Date();
      const todayZero = new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} 00:00:00`);

      // 전체 유저중에서
      for (const i of users) {
        if (i.teamRole === UserTeamRole.Leader) {
          continue;
        }
        const check = await this.ARepo.findOne({
          where: {
            userId: i.id,
            workStart: LessThan(today),
          },
        });
        // 오늘 출첵 안한 사람
        if (!check) {
          const vacation = await this.VRepo.findOne({
            where: {
              userId: i.id,
              date: todayZero,
            },
          });
          // 휴가 쓴 사람
          if (vacation) {
            // 하지만 오후 반차
            if (vacation.type === VacationEnum.PMOff) {
              await this.botService.sendBlockMessageByEmail(i.email, `${i.name}님, 출근 체크 깜빡하지 않으셨나요? 🧐`);
            }
          } else {
            // 휴가 안쓴 사람
            await this.botService.sendBlockMessageByEmail(i.email, `${i.name}님, 출근 체크 깜빡하지 않으셨나요? 🧐`);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getDailyAverage({ year, month, day, team }: GetDailyAverageInput): Promise<GetDailyAverageOutput> {
    try {
      const targetDay = `${year}-${month}-${day} 00:00:00`;
      const targetDayLast = `${year}-${month}-${day} 23:59:59`;

      const allUsers = await this.URepo.find({
        ...(team && {
          where: {
            team,
          },
        }),
      });

      const attendances = await this.ARepo.find({
        where: {
          workStart: Between(targetDay, targetDayLast),
        },
      });

      const vacations = await this.VRepo.find({
        where: {
          date: Between(targetDay, targetDayLast),
        },
      });

      const users: DailyAverageProp[] = [];
      let entireWorkTime = 0;
      let numberOfLeaders = 0;
      for (const i of allUsers) {
        let workTime = 0;
        const tmp: DailyAverageProp = {
          id: i.id,
          name: i.name,
          team: i.team,
          teamRole: i.teamRole,
        };
        const userAData = attendances.find((v) => v.userId === i.id);
        if (userAData) {
          if (userAData.workEnd) {
            if (i.teamRole !== UserTeamRole.Leader) {
              workTime = this.calcWorkTime(userAData.workStart, userAData.workEnd, userAData.dinner);
              entireWorkTime += workTime;
            }
          }
          tmp.workStart = userAData.workStart;
          tmp.workEnd = userAData.workEnd ? userAData.workEnd : null;
          tmp.duration = userAData.workEnd ? workTime : null;
          tmp.attendanceId = userAData.id;
          tmp.dinner = userAData.dinner;
        }
        const userVData = vacations.find((v) => v.userId === i.id);
        if (userVData) {
          tmp.vacation = userVData.type;
          if (userVData.type === VacationEnum.DayOff) {
            if (tmp.duration) {
              tmp.duration += 8;
            } else {
              tmp.duration = 8;
            }
          } else if (userVData.type === VacationEnum.official || userVData.type === VacationEnum.halfOfficial) {
          } else {
            if (tmp.duration) {
              tmp.duration += 4;
            } else {
              tmp.duration = 4;
            }
          }
        }
        if (i.teamRole === UserTeamRole.Leader) {
          numberOfLeaders++;
        }
        users.push(tmp);
      }

      return { ok: true, users, entireAvg: (entireWorkTime / (allUsers.length - numberOfLeaders)).toFixed(1) };
    } catch (err) {
      return { ok: false, error: 'Get user daily average failed' };
    }
  }

  async modifyAttendance({
    attendanceId,
    workStart,
    workEnd,
    userId,
    dinner,
  }: ModifyAttendanceInput): Promise<ModifyAttendanceOutput> {
    try {
      if (attendanceId) {
        await this.ARepo.update(attendanceId, {
          ...(workStart && { workStart }),
          ...(workEnd && { workEnd }),
          ...(dinner !== undefined && { dinner }),
        });

        return { ok: true, attendanceId };
      }

      const result = await this.ARepo.insert(
        this.ARepo.create({
          userId,
          ...(workStart && { workStart }),
          ...(workEnd && { workEnd }),
          ...(dinner !== undefined && { dinner }),
        }),
      );

      return { ok: true, attendanceId: result.raw.insertId };
    } catch (error) {
      return { ok: false, error: '근무 정보 수정에 실패하였습니다.' };
    }
  }

  async deleteAttendance({ attendanceId }: DeleteAttendanceInput): Promise<DeleteAttendanceOutput> {
    try {
      await this.ARepo.delete(attendanceId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '근무 정보 삭제에 실패하였습니다.' };
    }
  }

  async getMonthlyAverage({ year, month, team }: GetMonthlyAverageInput): Promise<GetMonthlyAverageOutput> {
    try {
      const targetMonth = new Date(`${year}-${month}`);
      const lastDay = new Date(year, month, 0).getDate();
      const targetMonthLastDay = new Date(`${year}-${month}-${lastDay} 23:59:59`);

      const allUsers = await this.URepo.find({
        ...(team && {
          where: {
            team,
          },
        }),
      });

      const users: MonthlyAverageProp[] = [];
      let entireWorkTime = 0;
      let numberOfLeaders = 0;

      for (const user of allUsers) {
        const aData = await this.ARepo.find({
          where: {
            workStart: Between(targetMonth, targetMonthLastDay),
            userId: user.id,
          },
        });

        const vData = await this.VRepo.find({
          where: {
            date: Between(targetMonth, targetMonthLastDay),
            userId: user.id,
          },
        });

        const tmp: MonthlyAverageProp = {
          id: user.id,
          name: user.name,
          team: user.team,
          teamRole: user.teamRole,
        };
        let monthWorkTime = 0;
        let MonthVacationTime = 0;
        let officialVacationTime = 0;

        if (user.teamRole === UserTeamRole.Leader) {
          numberOfLeaders++;
        }
        for (let i = 1; i <= lastDay; i++) {
          const userAData = aData.find((v) => v.workStart.getDate() === i);
          if (userAData) {
            if (userAData.workEnd) {
              monthWorkTime += this.calcWorkTime(userAData.workStart, userAData.workEnd, userAData.dinner);
            }
          }
          const userVData = vData.find((v) => v.date.getDate() === i);
          if (userVData) {
            switch (userVData.type) {
              case VacationEnum.DayOff:
                MonthVacationTime += 8;
                break;
              case VacationEnum.official:
                officialVacationTime += 8;
                break;
              case VacationEnum.halfOfficial:
                officialVacationTime += 4;
                break;
              default:
                MonthVacationTime += 4;
            }
          }
        }
        tmp.duration = monthWorkTime + MonthVacationTime;
        tmp.officialVacationTime = officialVacationTime;
        if (user.teamRole !== UserTeamRole.Leader) {
          entireWorkTime += tmp.duration;
        }
        users.push(tmp);
      }

      return {
        ok: true,
        users,
        entireAvg: (entireWorkTime / (allUsers.length - numberOfLeaders)).toFixed(1),
      };
    } catch (err) {
      return { ok: false, error: 'Get user monthly average failed' };
    }
  }

  async getWeeklyAverage({ startDate, endDate, team }: GetWeeklyAverageInput): Promise<GetWeeklyAverageOutput> {
    try {
      const allUsers = await this.URepo.find({
        ...(team && {
          where: {
            team,
          },
        }),
      });

      const users: MonthlyAverageProp[] = [];
      let entireWorkTime = 0;

      for (const user of allUsers) {
        const aData = await this.ARepo.find({
          where: {
            workStart: Between(startDate, endDate),
            userId: user.id,
          },
        });

        const vData = await this.VRepo.find({
          where: {
            date: Between(startDate, endDate),
            userId: user.id,
          },
        });

        const tmp: MonthlyAverageProp = {
          id: user.id,
          name: user.name,
          team: user.team,
          teamRole: user.teamRole,
        };
        let WorkTime = 0;
        let VacationTime = 0;
        let officialVacationTime = 0;

        for (let i = 0; i < aData.length; i++) {
          if (aData[i].workEnd) {
            WorkTime += this.calcWorkTime(aData[i].workStart, aData[i].workEnd, aData[i].dinner);
          }
        }
        for (let i = 0; i < vData.length; i++) {
          switch (vData[i].type) {
            case VacationEnum.DayOff:
              VacationTime += 8;
              break;
            case VacationEnum.official:
              officialVacationTime += 8;
              break;
            case VacationEnum.halfOfficial:
              officialVacationTime += 4;
              break;
            default:
              VacationTime += 4;
          }
        }

        tmp.duration = WorkTime + VacationTime;
        tmp.officialVacationTime = officialVacationTime;
        entireWorkTime += tmp.duration;
        users.push(tmp);
      }

      return { ok: true, users, entireAvg: (entireWorkTime / allUsers.length).toFixed(1) };
    } catch (err) {
      return { ok: false, error: 'Get user average failed' };
    }
  }

  async getAllRequests({ year, month, userId }: GetAllRequestsInput): Promise<GetAllRequestsOutput> {
    try {
      const targetMonth = new Date(`${year}-${month}`);
      const lastDay = new Date(year, month, 0).getDate();
      const targetMonthLastDay = new Date(`${year}-${month}-${lastDay} 23:59:59`);

      const requests = await this.RRepo.find({
        relations: ['user'],
        where: {
          createdAt: Between(targetMonth, targetMonthLastDay),
          check: Not(RequestType.WAITING),
          ...(userId && { userId }),
        },
      });

      return { ok: true, requests };
    } catch (error) {
      return { ok: false, error: 'Get all requests failed' };
    }
  }

  async getMyAttendance({ year, month }: GetMyAttendanceInput, user: User): Promise<GetMyAttendanceOutput> {
    try {
      const targetMonth = new Date(`${year}-${month}`);
      const lastDay = new Date(year, month, 0).getDate();
      const targetMonthLastDay = new Date(`${year}-${month}-${lastDay} 23:59:59`);

      const aData = await this.ARepo.find({
        where: {
          workStart: Between(targetMonth, targetMonthLastDay),
          userId: user.id,
        },
      });

      const vData = await this.VRepo.find({
        where: {
          date: Between(targetMonth, targetMonthLastDay),
          userId: user.id,
        },
      });

      const data: MyAttendanceProp[] = [];
      let monthWorkTime = 0;
      let MonthVacationTime = 0;
      let workDay = 0;

      for (let i = 1; i <= lastDay; i++) {
        const tmp: MyAttendanceProp = {};

        const userAData = aData.find((v) => v.workStart.getDate() === i);
        if (userAData) {
          tmp.workStart = userAData.workStart;
          if (userAData.workEnd) {
            tmp.workEnd = userAData.workEnd;
            tmp.duration = this.calcWorkTime(userAData.workStart, userAData.workEnd, userAData.dinner);
            monthWorkTime += this.calcWorkTime(userAData.workStart, userAData.workEnd, userAData.dinner);
            workDay++;
          }
        }
        const userVData = vData.find((v) => v.date.getDate() === i);
        if (userVData) {
          if (userVData.type === VacationEnum.DayOff) {
            MonthVacationTime += 8;
            workDay++;
          } else if (userVData.type === VacationEnum.PMOff || userVData.type === VacationEnum.AMOff) {
            MonthVacationTime += 4;
          }
          tmp.vacation = userVData.type;
        }
        if (userVData || userAData) {
          tmp.day = i;
          data.push(tmp);
        }
      }

      return { ok: true, data, entireAvg: ((MonthVacationTime + monthWorkTime) / workDay).toFixed(1) };
    } catch (err) {
      return { ok: false, error: 'Get attendance info failed' };
    }
  }

  async getMyRequests({ year, month }: GetMyRequestsInput, user: User): Promise<GetMyRequestsOutput> {
    try {
      const targetMonth = new Date(`${year}-${month}`);
      const lastDay = new Date(year, month, 0).getDate();
      const targetMonthLastDay = new Date(`${year}-${month}-${lastDay} 23:59:59`);

      const data = await this.RRepo.find({
        where: {
          createdAt: Between(targetMonth, targetMonthLastDay),
          userId: user.id,
        },
      });

      return { ok: true, requests: data };
    } catch (error) {
      return { ok: false, error: 'Get requests failed' };
    }
  }
}
