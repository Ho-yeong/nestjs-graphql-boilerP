import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceResolver } from './attendance.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/user.entity';
import { Vacation } from './entities/vacation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Request, User, Vacation])],
  providers: [AttendanceService, AttendanceResolver],
  exports: [AttendanceService],
})
export class AttendanceModule {}
