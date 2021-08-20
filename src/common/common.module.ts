import { Global, Module } from '@nestjs/common';
import { PUB_SUB } from './common.constants';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: pubsub,
    },
  ],
  exports: [PUB_SUB],
})
@Global()
export class CommonModule {}
