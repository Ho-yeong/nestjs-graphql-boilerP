import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { GetAllUsersOutput } from './dtos/getAllUsers.dto';
import { CreateAccountInput } from './dtos/createAccount.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { UserProfileInput, UserProfileOutput } from '../common/dtos/userProfile.dto';
import { LoginInput, LoginOutput } from '../common/dtos/login.dot';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query((returns) => GetAllUsersOutput)
  getAllUsers(): Promise<GetAllUsersOutput> {
    return this.usersService.getAllUsers();
  }

  @Query((returns) => UserProfileOutput)
  userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId);
  }
  @Mutation((returns) => LoginOutput)
  login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInput);
  }

  @Mutation((returns) => CoreOutput)
  createAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CoreOutput> {
    return this.usersService.createAccount(createAccountInput);
  }
}
