import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AttendanceService } from './attendance.service';
import { GetUserWorkTimeInput, GetUserWorkTimeOutput } from './dtos/getUserWorkTime.dto';
import { DoWorkInput, DoWorkOutput } from './dtos/doWork.dto';
import { GetRequestListOutput } from '../common/dtos/getRequestList.dto';
import { RequestCheckInput, RequestCheckOutput } from './dtos/requestCheck.dto';
import { RequestInput, RequestOutput } from './dtos/request.dto';
import { ModifyVacationInput, ModifyVacationOutput } from './dtos/modifyVacation.dto';
import { GetUserMonthlyWorkInput, GetUserMonthlyWorkOutput } from './dtos/getUserMonthlyWork.dto';

@Resolver()
export class AttendanceResolver {
  constructor(private readonly aService: AttendanceService) {}

  @Query((returns) => GetUserWorkTimeOutput)
  async getUserWorkTime(@Args('input') getUserWorkTimeInput: GetUserWorkTimeInput): Promise<GetUserWorkTimeOutput> {
    return this.aService.getUserWorkTime(getUserWorkTimeInput);
  }

  @Query((returns) => GetUserMonthlyWorkOutput)
  async getUserMonthlyWork(
    @Args('input') getUserMonthlyWork: GetUserMonthlyWorkInput,
  ): Promise<GetUserMonthlyWorkOutput> {
    return this.aService.getUserMonthlyWork(getUserMonthlyWork);
  }

  @Mutation((returns) => DoWorkOutput)
  async doWork(@Args('input') doWorkInput: DoWorkInput): Promise<DoWorkOutput> {
    return this.aService.doWork(doWorkInput);
  }

  @Query((returns) => GetRequestListOutput)
  async getRequestList(): Promise<GetRequestListOutput> {
    return this.aService.getRequestList();
  }

  @Mutation((returns) => RequestCheckOutput)
  async requestCheck(@Args('input') requestCheckInput: RequestCheckInput): Promise<RequestCheckOutput> {
    return this.aService.requestCheck(requestCheckInput);
  }

  @Mutation((returns) => RequestOutput)
  async request(@Args('input') requestInput: RequestInput): Promise<RequestOutput> {
    return this.aService.request(requestInput);
  }

  @Mutation((returns) => ModifyVacationOutput)
  async modifyVacation(@Args('input') modifyVacationInput: ModifyVacationInput): Promise<ModifyVacationOutput> {
    return this.aService.modifyVacation(modifyVacationInput);
  }
}
