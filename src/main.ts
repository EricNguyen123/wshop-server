import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { HTTP_RESPONSE } from './constants/http-response';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const corsOptions: CorsOptions = {
    origin: envs.feUrl,
    credentials: true,
  };

  app.enableCors(corsOptions);

  const port: number = envs.port ?? envs.defaultPort;
  await app.listen(port);
}
bootstrap().catch((error) => {
  const label = 'main.ts - [Bootstrap Error]';
  console.error(`${label} - ${error}`);
  return {
    status: HTTP_RESPONSE.COMMON.INTERNAL_SERVER_ERROR.code,
    message: HTTP_RESPONSE.COMMON.INTERNAL_SERVER_ERROR.message,
    code: HTTP_RESPONSE.COMMON.INTERNAL_SERVER_ERROR.code,
  };
});
