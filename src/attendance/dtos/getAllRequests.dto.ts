import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Request } from '../entities/request.entity';

@InputType()
export class GetAllRequestsInput {
  @Field((type) => Number)
  year: number;

  @Field((type) => Number)
  month: number;
}

@ObjectType()
export class GetAllRequestsOutput extends CoreOutput {
  @Field((type) => [Request], { nullable: true })
  requests?: Request[];
}
