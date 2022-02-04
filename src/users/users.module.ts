import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Vacation } from '../attendance/entities/vacation.entity';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Attendance, Vacation]), AttendanceModule],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
