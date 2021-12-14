import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { MonthlyAverageProp } from './getMonthlyAverage.dto';
import { UserTeam } from '../../users/entities/users.constants';

@InputType()
export class GetWeeklyAverageInput {
  @Field((type) => Date)
  startDate: Date;

  @Field((type) => Date)
  endDate: Date;

  @Field((type) => UserTeam, { nullable: true })
  team?: UserTeam;
}

@ObjectType()
export class GetWeeklyAverageOutput extends CoreOutput {
  @Field((type) => String, { nullable: true })
  entireAvg?: string;

  @Field((type) => [MonthlyAverageProp], { nullable: true })
  users?: MonthlyAverageProp[];
}
