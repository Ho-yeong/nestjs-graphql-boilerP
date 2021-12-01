import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class SendMessageInput {
  @Field((type) => [String])
  emails: string[];

  @Field((type) => String)
  content: string;
}

@ObjectType()
export class SendMessageOutput extends CoreOutput {}
