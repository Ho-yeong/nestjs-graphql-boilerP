import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class GetMonthlyAverageInput {
  @Field((type) => Number)
  year: number;

  @Field((type) => Number)
  month: number;
}

@ObjectType()
export class MonthlyAverageProp {
  @Field((type) => Number)
  id: number;

  @Field((type) => String)
  name: string;

  @Field((type) => String)
  team: string;

  @Field((type) => Number, { nullable: true })
  duration?: number;
}

@ObjectType()
export class GetMonthlyAverageOutput extends CoreOutput {
  @Field((type) => String, { nullable: true })
  entireAvg?: string;

  @Field((type) => [MonthlyAverageProp], { nullable: true })
  users?: MonthlyAverageProp[];
}
