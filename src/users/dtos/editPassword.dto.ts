import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class EditPasswordInput extends PickType(User, ['password']) {}

@ObjectType()
export class EditPasswordOutput extends CoreOutput {}
