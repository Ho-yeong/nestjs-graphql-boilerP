import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

//ExecutionContext === 현재 request
export const CurrentIP = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const gqlContext = GqlExecutionContext.create(context).getContext();
  return gqlContext.req.connection.remoteAddress;
});
