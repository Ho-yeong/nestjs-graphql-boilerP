import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsDate, IsNumber } from 'class-validator';
import { User } from '../../users/entities/user.entity';

@InputType('AttendanceInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  @IsNumber()
  id: number;

  @Column()
  @Field((type) => Number)
  @IsNumber()
  userId: number;

  @Field((type) => User, { nullable: false })
  @ManyToOne((type) => User, (user) => user.attendances, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @Column({ name: 'work_start' })
  @Field((type) => Date)
  @IsDate()
  workStart: Date;

  @Column({ name: 'work_end', nullable: true })
  @Field((type) => Date, { nullable: true })
  @IsDate()
  workEnd?: Date;

  @Column({ default: false })
  @Field((type) => Boolean, { defaultValue: false })
  @IsBoolean()
  dinner: boolean;
}
