import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Between, MoreThan, Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/createAccount.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { AllUserOutputProp, GetAllUsersOutput } from './dtos/getAllUsers.dto';
import { LoginInput } from '../common/dtos/login.dto';
import { JwtService } from '../jwt/jwt.service';
import { UserProfileOutput } from '../common/dtos/userProfile.dto';
import { DeleteAccountInput } from '../common/dtos/deleteAccount.dto';
import { EditPasswordInput } from './dtos/editPassword.dto';
import { UserRole } from './entities/users.constants';
import { Attendance } from '../attendance/entities/attendance.entity';
import * as moment from 'moment-timezone';
import { BotService } from '../bot/bot.service';
import { Vacation } from '../attendance/entities/vacation.entity';
import { VacationEnum } from '../attendance/entities/request.constant';
import { SendMessageInput, SendMessageOutput } from './dtos/sendMessage.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Attendance) private readonly ARepo: Repository<Attendance>,
    @InjectRepository(Vacation) private readonly VRepo: Repository<Vacation>,
    private readonly jwtService: JwtService,
    private readonly botService: BotService,
  ) {}

  async getAllUsers(): Promise<GetAllUsersOutput> {
    try {
      const usersData = await this.users.find({ order: { id: 'ASC' } });

      const today = new Date();
      const thisMonth = new Date(`${today.getFullYear()}-${today.getMonth() + 1}`);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      // 이번주 월요일
      const mon = moment(today).startOf('isoWeek');
      // 이번주 일요일
      const sun = mon.add(6, 'days');

      const users: AllUserOutputProp[] = [];

      for (const i of usersData) {
        let weekly = 0;
        let monthlyTime = 0;

        const KR_TIME_DIFF = 9 * 60 * 60 * 1000;

        const m = moment(new Date(mon.toDate().getTime() + KR_TIME_DIFF)).format('YYYY-MM-DD HH:mm:ss');
        const s = moment(new Date(sun.toDate().getTime() + KR_TIME_DIFF)).format('YYYY-MM-DD HH:mm:ss');

        const WeekAttendanceData = await this.ARepo.find({
          where: {
            userId: i.id,
            workStart: Between(m, s),
          },
        });

        const WeekVacationData = await this.VRepo.find({
          where: {
            date: Between(m, s),
            userId: i.id,
          },
        });

        for (const w of WeekAttendanceData) {
          let workTime = 0;

          if (w.workEnd) {
            const t1 = moment(w.workEnd);
            const t2 = moment(w.workStart);
            const diff = moment.duration(t1.diff(t2)).asHours();
            workTime = Math.ceil(diff - 2) < 0 ? 0 : Math.ceil(diff - 2);
          }
          weekly += workTime;
        }

        for (const i of WeekVacationData) {
          let vacationTime = 4;
          if (i.type == VacationEnum.DayOff) {
            vacationTime = 8;
          }
          weekly += vacationTime;
        }

        const vacationData = await this.VRepo.find({
          where: {
            date: MoreThan(thisMonth),
            userId: i.id,
          },
        });

        let tmp = new AllUserOutputProp();

        const data = await this.ARepo.find({ where: { userId: i.id, workStart: MoreThan(thisMonth) } });

        for (let i = 1; i <= lastDay; i++) {
          let workTime = 0;

          const vData = vacationData.find((v) => v.date.getDate() === i);
          let vacationWorkTime = 4;
          if (vData) {
            if (vData.type === VacationEnum.DayOff) {
              vacationWorkTime = 8;
            } else if (vData.type === VacationEnum.official) {
              vacationWorkTime = 0;
            }
          }

          const dayData = data.find((v) => v.workStart.getDate() === i);
          if (dayData) {
            if (dayData.workEnd) {
              let mealTime = 2;
              if (
                dayData.workStart >
                moment(
                  new Date(
                    `${dayData.workStart.getFullYear()}-${
                      dayData.workStart.getMonth() + 1
                    }-${dayData.workStart.getDate()} 13:00:00`,
                  ),
                ).toDate()
              ) {
                mealTime -= 1;
              }
              if (
                dayData.workEnd <
                moment(
                  new Date(
                    `${dayData.workStart.getFullYear()}-${
                      dayData.workStart.getMonth() + 1
                    }-${dayData.workStart.getDate()} 20:00:00`,
                  ),
                ).toDate()
              ) {
                mealTime -= 1;
              }

              const t1 = moment(dayData.workEnd);
              const t2 = moment(dayData.workStart);
              const diff = moment.duration(t1.diff(t2)).asHours();
              const result = Math.ceil(diff - mealTime);
              workTime = result < 0 ? 0 : result;
            }
          }
          monthlyTime += workTime;
          if (vData) {
            monthlyTime += vacationWorkTime;
          }
        }

        tmp = {
          ...i,
          weekly: weekly,
          monthly: monthlyTime,
        };

        users.push(tmp);
      }

      return { ok: true, users };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail(
        { id },
        {
          select: ['id', 'email', 'role', 'team', 'name', 'teamRole'],
        },
      );

      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error: 'User not found' };
    }
  }

  async createAccount(input: CreateAccountInput): Promise<CoreOutput> {
    try {
      const exists = await this.users.findOne(input.id);
      if (exists) {
        return { ok: false, error: 'ID is already in use' };
      }

      const existEmail = await this.users.findOne({
        where: {
          email: input.email,
        },
      });
      if (existEmail) {
        return { ok: false, error: 'Email is already in use' };
      }

      const newAccount = this.users.create(input);
      newAccount.password = '1234';
      newAccount.role = UserRole.Member;

      await this.users.save(newAccount);

      await this.botService.sendMessageByEmail(
        input.email,
        `${input.name}님, Vicgame Studios 입사를 축하드립니다 🎉🎉 지금부터 사내페이지(https://conf.vicgamestudios.com) 이용이 가능합니다 `,
      );

      return { ok: true };
    } catch (err) {
      console.log(err);
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async editAccount({ id, email, name, team, totalVacation, teamRole }: CreateAccountInput): Promise<CoreOutput> {
    try {
      const user = await this.users.findOne(id);
      if (!user) {
        return { ok: false, error: 'User not found' };
      }

      user.email = email;
      user.name = name;
      user.team = team;
      user.totalVacation = totalVacation;
      user.teamRole = teamRole;

      await this.users.update(id, user);

      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    //check if the password is correct
    // make a JWT and give it to the user
    try {
      //find the user with the email
      const user = await this.users.findOne({ email }, { select: ['password', 'id'] });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }
      const token = this.jwtService.sign({ id: user.id });

      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteAccount({ id }: DeleteAccountInput): Promise<CoreOutput> {
    try {
      const user = await this.users.findOne(id);
      if (!user) {
        return { ok: false, error: 'User not found' };
      }

      await this.users.delete(id);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async editPassword(user: User, { password }: EditPasswordInput) {
    try {
      if (!user) {
        return { ok: false, error: 'Edit password Error' };
      }
      const admin = await this.users.findOne(user.id);
      admin.password = password;
      await this.users.save(admin);

      await this.botService.sendMessageByEmail(
        user.email,
        `[${moment(new Date()).format('MM월 DD일')}] 비밀번호가 변경되었습니다.`,
      );

      return {
        ok: true,
      };
    } catch (err) {
      return {
        ok: false,
        error: "Couldn't edit password",
      };
    }
  }

  async sendMessage(user: User, { emails, content }: SendMessageInput): Promise<SendMessageOutput> {
    try {
      if (user.role !== UserRole.Admin) {
        return { ok: false, error: 'Authentication failure' };
      }

      for (const i of emails) {
        await this.botService.sendMessageByEmailForFinanceTeam(i, content);
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  @Cron('0 4 1 1 *')
  async initializeVacation() {
    try {
      await this.users.update(
        {
          id: MoreThan(0),
        },
        { vacation: 0 },
      );
    } catch (error) {
      console.log(error);
    }
  }
}
