import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async getAllUsers(): Promise<{ ok: boolean; error?: string; data?: User[] }> {
    try {
      const users = await this.users.find();

      return { ok: true, data: users };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
