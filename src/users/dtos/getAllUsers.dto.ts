import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { UserRole, UserTeam, UserTeamRole } from '../entities/users.constants';

@ObjectType()
export class AllUserOutputProp {
  @Field((type) => Number)
  id: number;

  @Field((type) => String)
  name: string;

  @Field((type) => String)
  email: string;

  @Field((type) => UserTeam)
  team: UserTeam;

  @Field((type) => UserRole)
  role: UserRole;

  @Field((type) => UserTeamRole)
  teamRole: UserTeamRole;

  @Field((type) => Number)
  totalVacation: number;

  @Field((type) => Number)
  vacation: number;

  @Field((type) => Number)
  weekly: number;

  @Field((type) => Number)
  monthly: number;
}

@ObjectType()
export class GetAllUsersOutput extends CoreOutput {
  @Field((type) => [AllUserOutputProp], { nullable: true })
  users?: AllUserOutputProp[];
}
