import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class ModifyAttendanceInput {
  @Field((type) => Number)
  userId: number;

  @Field((type) => Number, { nullable: true })
  attendanceId?: number;

  @Field((type) => Date, { nullable: true })
  workStart?: Date;

  @Field((type) => Date, { nullable: true })
  workEnd?: Date;

  @Field((type) => Boolean, { nullable: true })
  dinner?: boolean;
}

@ObjectType()
export class ModifyAttendanceOutput extends CoreOutput {
  @Field((type) => Number, { nullable: true })
  attendanceId?: number;
}
