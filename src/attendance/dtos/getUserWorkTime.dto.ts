import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Attendance } from '../entities/attendance.entity';

@InputType()
export class GetUserWorkTimeInput {
  @Field((type) => Number)
  userId: number;
}

@ObjectType()
export class GetUserWorkTimeOutput extends CoreOutput {
  @Field((type) => Number, { nullable: true })
  vacation?: number;

  @Field((type) => Number, { nullable: true })
  totalVacation?: number;

  @Field((type) => Number, { nullable: true })
  weekly?: number;

  @Field((type) => Number, { nullable: true })
  monthlyTime?: number;

  @Field((type) => Attendance, { nullable: true })
  todayWork?: Attendance;
}
