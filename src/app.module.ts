import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfigModule } from './config/databases/module-db/db.module';
import { DatabaseModule } from './config/databases/database.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { MailerModule } from './modules/mailer/mailer.module';
import googleOauthConfig from './config/oauth/google-oauth.config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { redisOption } from './config/redis/redis.config';
import { FileModule } from './modules/file/file.module';
import { MediaModule } from './modules/media/media.module';
import { BannerModule } from './modules/banner/banner.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [googleOauthConfig],
    }),
    RedisModule.forRoot(redisOption),
    DatabaseConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    MailerModule,
    FileModule,
    MediaModule,
    BannerModule,
    ProductsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
