import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  findAll(): Record<string, any> {
    console.log('healthy check');
    return {
      timestamp: new Date(),
      condition: 'good',
    };
  }
}
