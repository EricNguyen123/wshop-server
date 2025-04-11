/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import googleOauthConfig from 'src/config/oauth/google-oauth.config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { IUser } from 'src/interfaces/auth.interface';
import { StatusEnum } from 'src/common/enums/base.enum';
import { DGoogle } from 'src/dto/auth/google.dto';

interface IProfileGoogle {
  emails: { value: string }[];
  name: { givenName: string; familyName: string };
  provider: string;
  id: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    googleConfiguration: ConfigType<typeof googleOauthConfig> | undefined,
    private authService: AuthService
  ) {
    if (!googleConfiguration) {
      throw new Error('Google configuration is not defined');
    }
    super({
      clientID: googleConfiguration.clientID,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate<TUser = IUser>(
    accessToken: string,
    refreshToken: string,
    profile: IProfileGoogle,
    done: VerifyCallback
  ) {
    const googleUser: DGoogle = {
      email: profile.emails[0].value,
      name: profile.name.givenName + profile.name.familyName,
      encryptedPassword: '',
      status: StatusEnum.ACTIVE,
      provider: profile.provider,
      uid: profile.id,
    };
    const user = await this.authService.validateGoogleUser({ googleUser });
    done(null, user);
    return user as TUser;
  }
}
