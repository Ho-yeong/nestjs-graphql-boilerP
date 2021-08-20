import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Reservation } from '../entities/reservation.entity';

@ObjectType()
export class GetMyReservationOutput extends CoreOutput {
  @Field((type) => [Reservation], { nullable: true })
  reservations?: Reservation[];
}
