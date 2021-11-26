import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

import { Response as ExpressResponse } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const res = context.switchToHttp().getResponse<ExpressResponse>();
        res.set('Access-Control-Allow-Origin', 'conf.vicgamestudios.com');
        res.set('Access-Control-Allow-Credentials', 'true');
      }),
    );
  }
}
