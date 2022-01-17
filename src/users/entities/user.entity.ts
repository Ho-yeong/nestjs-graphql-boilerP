import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { UserRole, UserTeam, UserTeamRole } from './users.constants';
import { Reservation } from '../../reservation/entities/reservation.entity';
import { Request } from '../../attendance/entities/request.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(UserTeam, { name: 'UserTeam' });
registerEnumType(UserTeamRole, { name: 'UserTeamRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field((type) => String)
  @IsString()
  name: string;

  @Column({ unique: true })
  @Field((type) => String)
  @IsString()
  email: string;

  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserTeam })
  @Field((type) => UserTeam)
  @IsEnum(UserTeam)
  team: UserTeam;

  @Column({ type: 'enum', enum: UserRole })
  @Field((type) => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ type: 'enum', enum: UserTeamRole, default: UserTeamRole.Member })
  @Field((type) => UserTeamRole)
  @IsEnum(UserTeamRole)
  teamRole: UserTeamRole;

  @Column({ default: 0, type: 'float' })
  @Field((type) => Number)
  @IsNumber()
  vacation: number;

  @Column({ default: 0, type: 'float' })
  @Field((type) => Number)
  @IsNumber()
  totalVacation: number;

  @Field((type) => [Reservation], { nullable: true })
  @OneToMany((type) => Reservation, (reservation) => reservation.host, { nullable: true })
  reservations?: Reservation[];

  @Field((type) => [Request], { nullable: true })
  @OneToMany((type) => Request, (request) => request.user, { nullable: true })
  requests?: Request[];

  @Field((type) => [Attendance], { nullable: true })
  @OneToMany((type) => Attendance, (attendance) => attendance.user, { nullable: true })
  attendances?: Attendance[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (err) {
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(aPassword, this.password);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
