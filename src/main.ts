import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
const express = require('express');
const fs = require('fs');
const spdy = require('spdy');
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const expressApp = express();

  const options = {
    key: fs.readFileSync('./privateKey.key'),
    cert: fs.readFileSync('./certificate.crt'),
  };

  const server = spdy.createServer(options, expressApp);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  await server.listen(process.env.PORT || 433, '0.0.0.0');
}

bootstrap().then((r) => {
  console.log('🚀🚀server activating PORT : ' + process.env.PORT);
});
