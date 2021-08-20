import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { RoomsEnum } from './reservation.constant';

registerEnumType(RoomsEnum, { name: 'RoomsEnum' });

@InputType('ReservationInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  @IsNumber()
  id: number;

  @Field((type) => User, { nullable: false })
  @ManyToOne((type) => User, (user) => user.reservations, { onDelete: 'CASCADE', nullable: false })
  host: User;

  @Column({ nullable: true, type: 'json' })
  @Field((type) => [Number], { nullable: true })
  participantIds?: number[];

  @Field((type) => [User], { nullable: true })
  participants?: User[];

  @Column({ type: 'datetime' })
  @Field((type) => Date)
  startAt: Date;

  @Column({ type: 'datetime' })
  @Field((type) => Date)
  endAt: Date;

  @Column()
  @Field((type) => String)
  @IsString()
  title: string;

  @Column()
  @Field((type) => String)
  @IsString()
  content: string;

  @Column({ type: 'enum', enum: RoomsEnum })
  @Field((type) => RoomsEnum)
  @IsEnum(RoomsEnum)
  roomId: RoomsEnum;
}
