import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { VacationEnum } from '../entities/request.constant';

@InputType()
export class GetMyAttendanceInput {
  @Field((type) => Number)
  year: number;

  @Field((type) => Number)
  month: number;
}

@ObjectType()
export class MyAttendanceProp {
  @Field((type) => Number, { nullable: true })
  day?: number;

  @Field((type) => Date, { nullable: true })
  workStart?: Date;

  @Field((type) => Date, { nullable: true })
  workEnd?: Date;

  @Field((type) => Number, { nullable: true })
  duration?: number;

  @Field((type) => VacationEnum, { nullable: true })
  vacation?: VacationEnum;
}

@ObjectType()
export class GetMyAttendanceOutput extends CoreOutput {
  @Field((type) => [MyAttendanceProp], { nullable: true })
  data?: MyAttendanceProp[];

  @Field((type) => String, { nullable: true })
  entireAvg?: string;
}
