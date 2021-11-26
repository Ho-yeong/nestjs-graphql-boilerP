import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Vacation } from '../entities/vacation.entity';

@InputType()
export class GetAllVacationInput {
  @Field((type) => Number)
  userId: number;

  @Field((type) => Number)
  year: number;

  @Field((type) => Number)
  month: number;
}

@ObjectType()
export class GetAllVacationOutput extends CoreOutput {
  @Field((type) => [Vacation], { nullable: true })
  vacations?: Vacation[];
}
