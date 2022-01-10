import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { WorkType } from '../entities/request.constant';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class DoWorkInput {
  @Field((type) => Number)
  userId: number;

  @Field((type) => Number, { nullable: true })
  workId?: number;

  @Field((type) => String, { nullable: true })
  ip: string;

  @Field((type) => WorkType)
  workType: WorkType;

  @Field((type) => Boolean, { nullable: true })
  dinner?: boolean;
}

@ObjectType()
export class DoWorkOutput extends CoreOutput {}
