import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Vacation } from '../entities/vacation.entity';

@InputType()
export class ModifyVacationInput extends PickType(Vacation, ['type', 'date', 'userId']) {}

@ObjectType()
export class ModifyVacationOutput extends CoreOutput {
  @Field((type) => Number, { nullable: true })
  id?: number;
}
