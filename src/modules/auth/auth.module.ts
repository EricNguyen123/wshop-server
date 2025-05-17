import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { envs } from 'src/config/envs';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import googleOauthConfig from 'src/config/oauth/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MailerService } from '../mailer/mailer.service';
import { MailerModule } from '../mailer/mailer.module';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { RefreshJwtStrategy } from './strategies/refresh-token.strategy';
import { parseExpiresIn } from 'src/utils/jwt.util';
import { FileModule } from '../file/file.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      useFactory: () => ({
        secret: envs.jwtSecret,
        signOptions: { expiresIn: parseExpiresIn(envs.jwtExpiresIn) },
      }),
    }),
    ConfigModule.forFeature(googleOauthConfig),
    forwardRef(() => UsersModule),
    FileModule,
    MediaModule,
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    MailerService,
    RefreshJwtStrategy,
  ],
  exports: [JwtStrategy, PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
