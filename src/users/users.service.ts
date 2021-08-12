import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/createAccount.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { GetAllUsersOutput } from './dtos/getAllUsers.dto';
import { LoginInput } from '../common/dtos/login.dot';
import { JwtService } from '../jwt/jwt.service';
import { UserProfileOutput } from '../common/dtos/userProfile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async getAllUsers(): Promise<GetAllUsersOutput> {
    try {
      const users = await this.users.find();

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
          select: ['id', 'createdAt', 'updatedAt', 'password', 'email', 'role', 'team'],
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

      await this.users.save(this.users.create(input));

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
}
