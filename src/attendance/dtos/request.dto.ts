import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Request } from '../entities/request.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class RequestInput extends PickType(Request, ['userId', 'workType', 'workTime', 'reason']) {}

@ObjectType()
export class RequestOutput extends CoreOutput {}
