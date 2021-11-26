import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Request } from '../entities/request.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class RequestCheckInput extends PickType(Request, ['id']) {
  @Field((type) => Boolean)
  confirm: boolean;
}

@ObjectType()
export class RequestCheckOutput extends CoreOutput {}
