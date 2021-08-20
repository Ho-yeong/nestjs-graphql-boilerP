import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ReservationService } from './reservation.service';
import { CreateReservationInput, CreateReservationOutput } from './dtos/createReservation.dto';
import { Role } from '../auth/role.decorator';
import { AuthUser } from '../auth/authUser.decorator';
import { User } from '../users/entities/user.entity';
import { GetReservationInput, GetReservationOutput } from './dtos/getReservation.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { DeleteReservationInput } from './dtos/deleteReservation.dto';
import { GetMyReservationOutput } from './dtos/getMyReservation.dto';
import { Inject } from '@nestjs/common';
import { AVAILABLE_ROOMS, PUB_SUB } from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { Reservation } from './entities/reservation.entity';

@Resolver()
export class ReservationResolver {
  constructor(private readonly reserveService: ReservationService, @Inject(PUB_SUB) private readonly pubSub: PubSub) {}

  @Mutation((returns) => CreateReservationOutput)
  @Role(['Member', 'Admin'])
  createReservation(
    @Args('input') createReservationInput: CreateReservationInput,
    @AuthUser() authUser: User,
  ): Promise<CreateReservationOutput> {
    return this.reserveService.createReservation(authUser, createReservationInput);
  }

  @Query((returns) => GetReservationOutput)
  @Role(['Any'])
  getReservation(@Args('input') getReservationInput: GetReservationInput): Promise<GetReservationOutput> {
    return this.reserveService.getReservation(getReservationInput);
  }

  @Mutation((returns) => CoreOutput)
  @Role(['Member', 'Admin'])
  deleteReservation(@Args('input') deleteReservationInput: DeleteReservationInput, @AuthUser() user: User) {
    return this.reserveService.deleteReservation(user, deleteReservationInput);
  }

  @Query((returns) => GetMyReservationOutput)
  @Role(['Member', 'Admin'])
  getMyReservation(@AuthUser() user: User): Promise<GetMyReservationOutput> {
    return this.reserveService.getMyReservation(user);
  }

  // 첫 화면 회의실 상태 요청
  // 이후는 subscript 로 해결

  @Subscription((returns) => [Reservation], {
    resolve: (payload) => {
      return payload;
    },
  })
  @Role(['Any'])
  getAvailableRoomsSubscription() {
    return this.pubSub.asyncIterator(AVAILABLE_ROOMS);
  }

  @Query((returns) => GetMyReservationOutput)
  @Role(['Any'])
  getAvailableRooms() {
    return this.reserveService.getAvailableRooms();
  }
}
