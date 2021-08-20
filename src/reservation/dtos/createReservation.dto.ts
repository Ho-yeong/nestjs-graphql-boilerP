import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Reservation } from '../entities/reservation.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class CreateReservationInput extends PickType(Reservation, [
  'startAt',
  'endAt',
  'title',
  'content',
  'roomId',
  'participantIds',
]) {}

@ObjectType()
export class CreateReservationOutput extends CoreOutput {
  @Field((type) => Reservation, { nullable: true })
  reservation?: Reservation;
}
