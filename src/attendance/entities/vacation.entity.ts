import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsNumber } from 'class-validator';
import { VacationEnum } from './request.constant';

registerEnumType(VacationEnum, { name: 'VacationEnumType' });

@InputType('vacationInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Vacation {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  @IsNumber()
  id: number;

  @Column()
  @Field((type) => Number)
  @IsNumber()
  userId: number;

  @Column({ type: 'enum', enum: VacationEnum })
  @Field((type) => VacationEnum)
  @IsEnum(VacationEnum)
  type: VacationEnum;

  @Column()
  @Field((type) => Date)
  @IsDate()
  date: Date;

  @CreateDateColumn()
  @Field((type) => Date)
  @IsDate()
  createdAt: Date;
}
