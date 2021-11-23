import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { WorkType } from '../entities/request.constant';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class DoWorkInput {
  @Field((type) => Number)
  userId: number;

  @Field((type) => WorkType)
  workType: WorkType;
}

@ObjectType()
export class DoWorkOutput extends CoreOutput {}
