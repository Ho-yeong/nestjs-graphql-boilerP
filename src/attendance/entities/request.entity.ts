import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { WorkType } from './request.constant';
import { User } from '../../users/entities/user.entity';

registerEnumType(WorkType, { name: 'WorkTypeEnum' });

@InputType('RequestInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Request {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  @IsNumber()
  id: number;

  @CreateDateColumn()
  @Field((type) => Date)
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @Field((type) => Date)
  @IsDate()
  updatedAt: Date;

  @Column()
  @Field((type) => Number)
  @IsNumber()
  userId: number;

  @Field((type) => User, { nullable: false })
  @ManyToOne((type) => User, (user) => user.requests, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @Column()
  @Field((type) => Number)
  @IsNumber()
  attendanceId: number;

  @Column({ type: 'enum', enum: WorkType })
  @Field((type) => WorkType)
  @IsEnum(WorkType)
  workType: WorkType;

  @Column()
  @Field((type) => Date)
  @IsDate()
  workDate: Date;

  @Column()
  @Field((type) => Date)
  @IsDate()
  WillFixTime: Date;

  @Column()
  @Field((type) => String)
  @IsString()
  reason: string;

  @Column({ default: false })
  @Field((type) => Boolean)
  @IsBoolean()
  check: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  setDefaultDate() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
