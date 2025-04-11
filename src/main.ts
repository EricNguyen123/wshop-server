import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { HTTP_RESPONSE } from './constants/http-response';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ForbiddenException, HttpStatus } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('webAPI')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const corsOptions: CorsOptions = {
    origin: envs.feUrl,
    credentials: true,
  };

  app.enableCors(corsOptions);
  app.setGlobalPrefix('api');

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
