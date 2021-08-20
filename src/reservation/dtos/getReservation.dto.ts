import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Reservation } from '../entities/reservation.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class GetReservationInput extends PickType(Reservation, ['roomId']) {}

@ObjectType()
export class GetReservationOutput extends CoreOutput {
  @Field((returns) => [Reservation], { nullable: true })
  reservations?: Reservation[];
}
