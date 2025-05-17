import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { HTTP_RESPONSE } from './constants/http-response';
import { SwaggerModule } from '@nestjs/swagger';
import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { SWAGGER_CONFIG } from './config/swagger/swagger.config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
  });

  const documentFactory = () => SwaggerModule.createDocument(app, SWAGGER_CONFIG.documentBuilder());
  SwaggerModule.setup(SWAGGER_CONFIG.path, app, documentFactory);

  const corsOptions: CorsOptions = {
    origin: envs.feUrl,
    credentials: true,
  };

  app.enableCors(corsOptions);
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/api',
  });

  const port: number = envs.port ?? envs.defaultPort;
  await app.listen(port);
}
bootstrap().catch((error) => {
  const label = 'main.ts - [Bootstrap Error]';
  console.error(`${label} - ${JSON.stringify(error)}`);
  throw new ForbiddenException({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: HTTP_RESPONSE.COMMON.INTERNAL_SERVER_ERROR.message,
    code: HTTP_RESPONSE.COMMON.INTERNAL_SERVER_ERROR.code,
  });
});
