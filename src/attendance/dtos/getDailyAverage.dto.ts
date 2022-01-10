import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { VacationEnum } from '../entities/request.constant';
import { UserTeam, UserTeamRole } from '../../users/entities/users.constants';

@InputType()
export class GetDailyAverageInput {
  @Field((type) => Number)
  year: number;

  @Field((type) => Number)
  month: number;

  @Field((type) => Number)
  day: number;

  @Field((type) => UserTeam, { nullable: true })
  team?: UserTeam;
}

@ObjectType()
export class DailyAverageProp {
  @Field((type) => Number)
  id: number;

  @Field((type) => Number, { nullable: true })
  attendanceId?: number;

  @Field((type) => String)
  name: string;

  @Field((type) => String)
  team: string;

  @Field((type) => UserTeamRole)
  teamRole: UserTeamRole;

  @Field((type) => Date, { nullable: true })
  workStart?: Date;

  @Field((type) => Date, { nullable: true })
  workEnd?: Date;

  @Field((type) => Number, { nullable: true })
  duration?: number;

  @Field((type) => VacationEnum, { nullable: true })
  vacation?: VacationEnum;

  @Field((type) => Boolean, { nullable: true })
  dinner?: boolean;
}

@ObjectType()
export class GetDailyAverageOutput extends CoreOutput {
  @Field((type) => String, { nullable: true })
  entireAvg?: string;

  @Field((type) => [DailyAverageProp], { nullable: true })
  users?: DailyAverageProp[];
}
