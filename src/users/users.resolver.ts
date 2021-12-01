import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { GetAllUsersOutput } from './dtos/getAllUsers.dto';
import { CreateAccountInput } from './dtos/createAccount.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { UserProfileInput, UserProfileOutput } from '../common/dtos/userProfile.dto';
import { LoginInput, LoginOutput } from '../common/dtos/login.dto';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { User } from './entities/user.entity';
import { Role } from '../auth/role.decorator';
import { AuthUser } from '../auth/authUser.decorator';
import { DeleteAccountInput } from '../common/dtos/deleteAccount.dto';
import { EditPasswordInput, EditPasswordOutput } from './dtos/editPassword.dto';
import { SendMessageInput, SendMessageOutput } from './dtos/sendMessage.dto';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService, @Inject(PUB_SUB) private readonly pubSub: PubSub) {}

  @Query((returns) => GetAllUsersOutput)
  getAllUsers(): Promise<GetAllUsersOutput> {
    return this.usersService.getAllUsers();
  }

  @Query((returns) => User)
  @Role(['Any'])
  me(@AuthUser() authUser: User) {
    return authUser;
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

  @Mutation((returns) => CoreOutput)
  @Role(['Admin'])
  editAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CoreOutput> {
    return this.usersService.editAccount(createAccountInput);
  }

  @Mutation((returns) => CoreOutput)
  @Role(['Admin'])
  deleteAccount(@Args('input') deleteAccountInput: DeleteAccountInput): Promise<CoreOutput> {
    return this.usersService.deleteAccount(deleteAccountInput);
  }

  @Mutation((returns) => EditPasswordOutput)
  @Role(['Member', 'Admin'])
  editPassword(
    @AuthUser() authUser: User,
    @Args('input') editPasswordInput: EditPasswordInput,
  ): Promise<EditPasswordOutput> {
    return this.usersService.editPassword(authUser, editPasswordInput);
  }

  @Mutation((returns) => SendMessageOutput)
  @Role(['Admin'])
  sendMessage(
    @AuthUser() authUser: User,
    @Args('input') sendMessageInput: SendMessageInput,
  ): Promise<SendMessageOutput> {
    return this.usersService.sendMessage(authUser, sendMessageInput);
  }
}
