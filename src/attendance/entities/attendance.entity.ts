import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsDate, IsNumber } from 'class-validator';

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

  @Column({ name: 'work_start' })
  @Field((type) => Date)
  @IsDate()
  workStart: Date;

  @Column({ name: 'work_end', nullable: true })
  @Field((type) => Date, { nullable: true })
  @IsDate()
  workEnd?: Date;
}
