import { Field, ObjectType } from '@nestjs/graphql';
import { Request } from '../../attendance/entities/request.entity';
import { CoreOutput } from './output.dto';

@ObjectType()
export class GetRequestListOutput extends CoreOutput {
  @Field((type) => [Request], { nullable: true })
  requests?: Request[];
}
