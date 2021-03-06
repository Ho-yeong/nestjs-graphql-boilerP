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
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { RequestType, WorkType } from './request.constant';
import { User } from '../../users/entities/user.entity';

registerEnumType(WorkType, { name: 'WorkTypeEnum' });
registerEnumType(RequestType, { name: 'RequestTypeEnum' });

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

  @Column({ nullable: true })
  @Field((type) => Number, { nullable: true })
  @IsNumber()
  attendanceId?: number;

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

  @Column({ enum: RequestType, type: 'enum' })
  @Field((type) => RequestType)
  @IsEnum(RequestType)
  check: RequestType;

  @BeforeInsert()
  @BeforeUpdate()
  setDefaultDate() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
