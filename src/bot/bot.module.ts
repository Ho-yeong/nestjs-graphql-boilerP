import { DynamicModule, Global, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotApiModuleOptions } from './bot.constant';

@Module({})
@Global()
export class BotModule {
  static forRoot(options: BotApiModuleOptions): DynamicModule {
    return {
      module: BotModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        BotService,
      ],
      exports: [BotService],
    };
  }
}
