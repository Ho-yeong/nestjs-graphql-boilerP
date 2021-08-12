import { Resolver, Query } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { GetAllUsersOutput } from './dtos/getAllUsers.dto';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query((returns) => GetAllUsersOutput)
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
