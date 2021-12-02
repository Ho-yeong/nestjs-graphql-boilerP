import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  await app.listen(process.env.PORT || 80, '0.0.0.0');
}

bootstrap().then((r) => {
  console.log('🚀🚀server activating PORT : ' + process.env.PORT);
});
