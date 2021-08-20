import { InputType, PickType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@InputType()
export class DeleteAccountInput extends PickType(User, ['id']) {}
