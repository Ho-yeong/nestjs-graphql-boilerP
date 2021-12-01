import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { User } from './users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from './jwt/jwt.module';
import { ReservationModule } from './reservation/reservation.module';
import { Reservation } from './reservation/entities/reservation.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { SocketModule } from './socket/socket.module';
import { AttendanceModule } from './attendance/attendance.module';
import { Attendance } from './attendance/entities/attendance.entity';
import { Request } from './attendance/entities/request.entity';
import { BotModule } from './bot/bot.module';
import { Vacation } from './attendance/entities/vacation.entity';
import { ResponseInterceptor } from './auth/reponse.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.string().valid(),
        DB_PORT: Joi.string().valid(),
        DB_USERNAME: Joi.string().valid(),
        DB_PASSWORD: Joi.string().valid(),
        DB_NAME: Joi.string().valid(),
        PRIVATE_KEY: Joi.string().valid().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            charset: 'utf8',
          }),
      synchronize: true,
      logging: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
      entities: [User, Reservation, Attendance, Request, Vacation],
      charset: 'utf8',
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      installSubscriptionHandlers: true,
      context: ({ req, connection }) => {
        const TOKEN_KEY = 'x-jwt';
        return { token: req ? req.headers[TOKEN_KEY] : connection.context[TOKEN_KEY] };
      },
    }),
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
    AuthModule,
    UsersModule,
    CommonModule,
    ReservationModule,
    ScheduleModule.forRoot(),
    SocketModule,
    AttendanceModule,
    BotModule.forRoot({
      AppKey: process.env.BOTKEY,
      AppKey2: process.env.BOT2KEY,
      ApiUrl: process.env.API_URL,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
