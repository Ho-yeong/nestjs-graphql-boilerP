import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AttendanceService } from './attendance.service';
import { GetUserWorkTimeInput, GetUserWorkTimeOutput } from './dtos/getUserWorkTime.dto';
import { DoWorkInput, DoWorkOutput } from './dtos/doWork.dto';
import { GetRequestListOutput } from '../common/dtos/getRequestList.dto';
import { RequestCheckInput, RequestCheckOutput } from './dtos/requestCheck.dto';
import { RequestInput, RequestOutput } from './dtos/request.dto';
import { ModifyVacationInput, ModifyVacationOutput } from './dtos/modifyVacation.dto';
import { GetUserMonthlyWorkInput, GetUserMonthlyWorkOutput } from './dtos/getMonthlyWork.dto';
import { AuthUser } from '../auth/authUser.decorator';
import { User } from '../users/entities/user.entity';
import { COMPANY_IPS } from './ip.constant';
import { GetAllVacationInput, GetAllVacationOutput } from './dtos/getAllVacation.dto';
import { DeleteVacationInput, DeleteVacationOutput } from './dtos/deleteVacation.dto';
import { GetDailyAverageInput, GetDailyAverageOutput } from './dtos/getDailyAverage.dto';
import { ModifyAttendanceInput, ModifyAttendanceOutput } from './dtos/modifyAttendance.dto';
import { DeleteAttendanceInput, DeleteAttendanceOutput } from './dtos/deleteAttendance.dto';
import { GetMonthlyAverageInput, GetMonthlyAverageOutput } from './dtos/getMonthlyAverage.dto';
import { GetWeeklyAverageInput, GetWeeklyAverageOutput } from './dtos/getWeeklyAverage.dto';
import { GetAllRequestsInput, GetAllRequestsOutput } from './dtos/getAllRequests.dto';
import { GetMyAttendanceInput, GetMyAttendanceOutput } from './dtos/getMyAttendance.dto';
import { GetMyRequestsInput, GetMyRequestsOutput } from './dtos/getMyRequests.dto';

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

  @Query((returns) => GetAllVacationOutput)
  async getAllVacations(@Args('input') getAllVacationInput: GetAllVacationInput): Promise<GetAllVacationOutput> {
    return this.aService.getAllVacations(getAllVacationInput);
  }

  @Mutation((returns) => DoWorkOutput)
  async doWork(@Args('input') doWorkInput: DoWorkInput): Promise<DoWorkOutput> {
    // if (!COMPANY_IPS.includes(doWorkInput.ip)) {
    //   return { ok: false, error: '사내 인터넷망에 접속해주세요' };
    // }
    return this.aService.doWork(doWorkInput);
  }

  @Query((returns) => GetRequestListOutput)
  async getRequestList(): Promise<GetRequestListOutput> {
    return this.aService.getRequestList();
  }

  @Mutation((returns) => RequestCheckOutput)
  async requestCheck(
    @Args('input') requestCheckInput: RequestCheckInput,
    @AuthUser() user: User,
  ): Promise<RequestCheckOutput> {
    return this.aService.requestCheck(requestCheckInput, user);
  }

  @Mutation((returns) => RequestOutput)
  async request(@Args('input') requestInput: RequestInput): Promise<RequestOutput> {
    return this.aService.request(requestInput);
  }

  @Mutation((returns) => ModifyVacationOutput)
  async modifyVacation(
    @Args('input') modifyVacationInput: ModifyVacationInput,
    @AuthUser() user: User,
  ): Promise<ModifyVacationOutput> {
    return this.aService.modifyVacation(modifyVacationInput, user);
  }

  @Mutation((returns) => DeleteVacationOutput)
  async deleteVacation(@Args('input') deleteVacationInput: DeleteVacationInput): Promise<DeleteVacationOutput> {
    return this.aService.deleteVacation(deleteVacationInput);
  }

  @Query((returns) => GetDailyAverageOutput)
  async getDailyAverage(@Args('input') getDailyAverage: GetDailyAverageInput): Promise<GetDailyAverageOutput> {
    return this.aService.getDailyAverage(getDailyAverage);
  }

  @Mutation((returns) => ModifyAttendanceOutput)
  async modifyAttendance(@Args('input') modifyAttendanceInput: ModifyAttendanceInput): Promise<ModifyAttendanceOutput> {
    return this.aService.modifyAttendance(modifyAttendanceInput);
  }

  @Mutation((returns) => DeleteAttendanceOutput)
  async deleteAttendance(@Args('input') deleteAttendanceInput: DeleteAttendanceInput): Promise<DeleteAttendanceOutput> {
    return this.aService.deleteAttendance(deleteAttendanceInput);
  }

  @Query((returns) => GetMonthlyAverageOutput)
  async getMonthlyAverage(
    @Args('input') getMonthlyAverageOutput: GetMonthlyAverageInput,
  ): Promise<GetMonthlyAverageOutput> {
    return this.aService.getMonthlyAverage(getMonthlyAverageOutput);
  }

  @Query((returns) => GetWeeklyAverageOutput)
  async getWeeklyAverage(
    @Args('input') getWeeklyAverageOutput: GetWeeklyAverageInput,
  ): Promise<GetWeeklyAverageOutput> {
    return this.aService.getWeeklyAverage(getWeeklyAverageOutput);
  }

  @Query((returns) => GetAllRequestsOutput)
  async getAllRequests(@Args('input') getAllRequestsInput: GetAllRequestsInput): Promise<GetAllRequestsOutput> {
    return this.aService.getAllRequests(getAllRequestsInput);
  }

  @Query((returns) => GetMyAttendanceOutput)
  async getMyAttendance(
    @Args('input') getMyAttendanceInput: GetMyAttendanceInput,
    @AuthUser() user: User,
  ): Promise<GetMyAttendanceOutput> {
    return this.aService.getMyAttendance(getMyAttendanceInput, user);
  }

  @Query((returns) => GetMyRequestsOutput)
  async getMyRequests(
    @Args('input') getMyRequestsInput: GetMyRequestsInput,
    @AuthUser() user: User,
  ): Promise<GetMyRequestsOutput> {
    return this.aService.getMyRequests(getMyRequestsInput, user);
  }
}
