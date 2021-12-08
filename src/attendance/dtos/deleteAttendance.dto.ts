import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class DeleteAttendanceInput {
  @Field((type) => Number)
  attendanceId: number;
}

@ObjectType()
export class DeleteAttendanceOutput extends CoreOutput {}
