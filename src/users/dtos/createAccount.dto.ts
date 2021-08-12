import { InputType, OmitType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@InputType()
export class CreateAccountInput extends OmitType(User, ['createdAt', 'updatedAt']) {}
