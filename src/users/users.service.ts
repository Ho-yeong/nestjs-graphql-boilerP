import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/createAccount.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { GetAllUsersOutput } from './dtos/getAllUsers.dto';
import { LoginInput } from '../common/dtos/login.dto';
import { JwtService } from '../jwt/jwt.service';
import { UserProfileOutput } from '../common/dtos/userProfile.dto';
import { PUB_SUB } from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { DeleteAccountInput } from '../common/dtos/deleteAccount.dto';
import { EditPasswordInput } from './dtos/editPassword.dto';
import { UserRole } from './entities/users.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
    private readonly jwtService: JwtService,
  ) {}

  async getAllUsers(): Promise<GetAllUsersOutput> {
    try {
      const users = await this.users.find({ order: { id: 'ASC' } });

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
      return { ok: false, error: 'User not found' };
    }
  }

  async createAccount(input: CreateAccountInput): Promise<CoreOutput> {
    try {
      const exists = await this.users.findOne(input.id);
      if (exists) {
        return { ok: false, error: 'already exist' };
      }

      const newAccount = this.users.create(input);
      newAccount.password = '1234';
      newAccount.role = UserRole.Member;

      await this.users.save(newAccount);

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

      await this.pubSub.publish('test', { test: { ...user } });
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
