import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Request } from '../entities/request.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class RequestInput extends PickType(Request, ['userId', 'workType', 'workDate', 'reason', 'workTime']) {}

@ObjectType()
export class RequestOutput extends CoreOutput {}
