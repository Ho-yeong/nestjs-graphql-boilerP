import { InputType, PickType } from '@nestjs/graphql';
import { Reservation } from '../entities/reservation.entity';

@InputType()
export class DeleteReservationInput extends PickType(Reservation, ['id']) {}
