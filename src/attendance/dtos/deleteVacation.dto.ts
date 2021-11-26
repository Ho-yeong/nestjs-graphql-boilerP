import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class DeleteVacationInput {
  @Field((type) => Number)
  id: number;
}

@ObjectType()
export class DeleteVacationOutput extends CoreOutput {}
