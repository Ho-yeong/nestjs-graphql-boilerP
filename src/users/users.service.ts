import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Attendance) private readonly ARepo: Repository<Attendance>,
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
      const monDate = mon.toDate().getDate();
      // 이번주 일요일
      const sun = mon.add(6, 'days');
      const sunDate = sun.toDate().getDate();

      const users: AllUserOutputProp[] = [];

      for (const i of usersData) {
        let weekly = 0;
        let monthlyTime = 0;
        let tmp = new AllUserOutputProp();

        const data = await this.ARepo.find({ where: { userId: i.id, workStart: MoreThan(thisMonth) } });

        for (let i = 1; i <= lastDay; i++) {
          let workTime = 0;
          const dayData = data.find((v) => v.workStart.getDate() === i);
          if (dayData) {
            if (dayData.workEnd) {
              const t1 = moment(dayData.workEnd);
              const t2 = moment(dayData.workStart);
              const diff = moment.duration(t1.diff(t2)).asHours();
              workTime = Math.ceil(diff - 2);
            }
          }
          if (i >= monDate && i <= sunDate) {
            weekly += workTime;
          }
          monthlyTime += workTime;
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
          select: ['id', 'email', 'role', 'team', 'name'],
        },
      );

      return {
        ok: true,
        user,
      };
    } catch (error) {
      console.log(error);
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
        `${input.name}님, Vicgame Studios 입사를 축하드립니다 🎉🎉 지금부터 사내페이지(https://localhost:8000) 이용이 가능합니다 `,
      );

      return { ok: true };
    } catch (err) {
      console.log(err);
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async editAccount({ id, email, name, team, totalVacation }: CreateAccountInput): Promise<CoreOutput> {
    try {
      const user = await this.users.findOne(id);
      if (!user) {
        return { ok: false, error: 'User not found' };
      }

      user.email = email;
      user.name = name;
      user.team = team;
      user.totalVacation = totalVacation;

      await this.users.update(id, user);

      return { ok: true };
    } catch (err) {
      console.log(err);
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
}
