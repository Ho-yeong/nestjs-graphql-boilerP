import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class GetUserMonthlyWorkInput {
  @Field((type) => Number)
  userId: number;

  @Field((type) => Number)
  year: number;

  @Field((type) => Number)
  month: number;
}

@ObjectType()
export class AttendanceMonthlyData {
  @Field((type) => String)
  name: string;

  @Field((type) => Number)
  workTime: number;
}

@ObjectType()
export class GetUserMonthlyWorkOutput extends CoreOutput {
  @Field((type) => [AttendanceMonthlyData], { nullable: true })
  monthly?: AttendanceMonthlyData[];
}
