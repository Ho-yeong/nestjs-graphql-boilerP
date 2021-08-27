import { InputType, PickType } from '@nestjs/graphql';
import { Reservation } from '../entities/reservation.entity';

@InputType()
export class EditReservationInput extends PickType(Reservation, ['id', 'startAt', 'endAt']) {}
