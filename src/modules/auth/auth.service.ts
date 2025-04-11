/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { envs } from 'src/config/envs';
import * as bcrypt from 'bcrypt';
import { MailerService } from '../mailer/mailer.service';
import { DGoogle } from 'src/dto/auth/google.dto';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { StatusEnum } from 'src/common/enums/base.enum';
import { LENGTH_PASSWORD_DEFAULT, SECOND_DEFAULT, SYMBOLS } from 'src/constants/base.constant';
import { generateNumericOtp } from 'src/utils/otp.util';
import {
  IChangeForgotPassword,
  IChangePassword,
  IChangePasswordRes,
  ICheckUser,
  ILogin,
  ILoginRes,
  ILogoutRes,
  IRegister,
  IVerifyEmail,
} from 'src/interfaces/auth.interface';
import { IUser } from 'src/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailerService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis
  ) {}

  private readonly logger = new Logger(AuthService.name, { timestamp: true });

  async register(payload: { data: IRegister }): Promise<UserEntity> {
    const { data } = payload;
    const userData = {
      name: data.name,
      email: data.email,
      encryptedPassword: bcrypt.hashSync(data.password, envs.bcryptSaltRound),
    };
    const user = await this.usersService.create({ user: userData });
    if (!user) {
      throw new UnauthorizedException('Created fail');
    }

    await bcrypt.hash(data.email, envs.bcryptSaltRound).then(async (hashedEmail) => {
      const dataReq = {
        from: { name: envs.appName, address: envs.mailFromAddress },
        recipients: [{ name: data.name, address: data.email }],
        subject: 'Welcome to WebShop',
        html: `
        <p>
          <strong>Hi ${data.name}!</strong>
          <a href="${envs.appUrl}/auth/verify?email=${data.email}&token=${hashedEmail}"> Verify </a>
        </p>`,
      };

      await this.mailService.sendMail({ data: dataReq });
    });

    return user;
  }

  async validateUser(payload: { id: string }): Promise<UserEntity> {
    const { id } = payload;
    const user = await this.usersService.findOneById({ id });
    return user;
  }

  async validateCheckUser(payload: { data: ICheckUser }) {
    const { data } = payload;
    const user = await this.usersService.findOneByEmail({ email: data.email });
    if (user && (await bcrypt.compare(data.password, user.encryptedPassword))) {
      return user;
    }
    return null;
  }

  async validateGoogleUser(payload: { googleUser: DGoogle }) {
    const { googleUser } = payload;
    const user = await this.usersService.findOneByEmail({ email: googleUser.email });
    if (user) return user;
    const randomPassword = this.generateRandomPassword(LENGTH_PASSWORD_DEFAULT);
    googleUser.encryptedPassword = bcrypt.hashSync(randomPassword, envs.bcryptSaltRound);
    const userNew: IUser = {
      ...googleUser,
    };
    return await this.usersService.create({ user: userNew });
  }

  generateRandomPassword(length: number): string {
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
      password += SYMBOLS[randomIndex];
    }
    return password;
  }

  async login(payload: { data: ILogin }): Promise<ILoginRes> {
    const { data } = payload;
    const user = await this.usersService.findOneByEmail({ email: data.email });
    if (!user) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.encryptedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.LOGIN_ERROR.message,
        code: HTTP_RESPONSE.AUTH.LOGIN_ERROR.code,
      });
    }

    if (!user.status) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.STATUS_ERROR.message,
        code: HTTP_RESPONSE.AUTH.STATUS_ERROR.code,
      });
    }

    const token = this.getJwtToken({ userId: user.id });
    await this.setBlacklistToken({ userId: user.id, token });
    const updateUser = await this.updateToken({ id: user.id, token });

    return {
      user: updateUser,
      token,
    };
  }

  async loginWithGoogle(payload: { email: string }): Promise<ILoginRes> {
    const { email } = payload;
    const user = await this.usersService.findOneByEmail({ email });
    if (!user) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.EXISTED_USER.message,
        code: HTTP_RESPONSE.USER.EXISTED_USER.code,
      });
    }
    const token = this.getJwtToken({ userId: user.id });
    await this.setBlacklistToken({ userId: user.id, token });
    const updateUser = await this.updateToken({ id: user.id, token });

    return {
      user: updateUser,
      token,
    };
  }

  async logout(payload: { token: string }): Promise<ILogoutRes> {
    const { token } = payload;
    const checkToken = await this.isTokenBlacklisted(token);

    const user = await this.usersService.findOneByTokens({ tokens: token });

    if (!user && !checkToken) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }

    if (!checkToken) {
      await this.setBlacklistToken({ userId: user?.id, token });
    }

    const data = await this.getDataInBlackList({ token });
    const userId = user ? user?.id : data.userId;
    const updateUser = await this.usersService.updateUser({
      id: userId,
      data: {
        lastSignInAt: new Date(),
      },
    });
    if (!updateUser) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.UPDATE_FAIL.message,
        code: HTTP_RESPONSE.USER.UPDATE_FAIL.code,
      });
    }

    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.AUTH.LOGOUT_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.LOGOUT_SUCCESS.code,
    };
  }

  async changePassword(payload: {
    data: IChangePassword;
    id: string;
  }): Promise<IChangePasswordRes> {
    const { data, id } = payload;

    const user = await this.usersService.updatePassword({
      id,
      currentPassword: data.currentPassword,
      newPassword: data.password,
    });

    return {
      message: HTTP_RESPONSE.AUTH.CHANGE_PASSWORD_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.CHANGE_PASSWORD_SUCCESS.code,
      status: HttpStatus.OK,
      data: user,
    };
  }

  private getJwtToken(payload: { userId: string }): string {
    return this.jwtService.sign({ id: payload.userId });
  }

  async getCurrentToken(id: string): Promise<string> {
    const user = await this.usersService.findOneById({ id });
    if (!user)
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    const token = user.tokens;
    return token;
  }

  async updateToken(payload: { id: string; token: string }): Promise<UserEntity> {
    const { id, token } = payload;
    const data = {
      tokens: token,
      currentSignInAt: new Date(),
    };
    const updateUser = await this.usersService.updateUser({
      id,
      data,
    });
    return updateUser;
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await this.redis.get(`blacklist:${token}`);
    return !!isBlacklisted;
  }

  async getDataInBlackList(payload: { token: string }): Promise<{ userId: string; token: string }> {
    const { token } = payload;
    const data = await this.redis.get(`blacklist:${token}`);
    if (!data) throw new UnauthorizedException('Token not found');
    return JSON.parse(data) as { userId: string; token: string };
  }

  async setBlacklistToken(payload: { userId?: string; token: string }) {
    const { userId, token } = payload;
    const decodedToken = this.jwtService.decode<{
      exp: number;
    }>(token);

    if (!decodedToken || !decodedToken.exp) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.INVALID_TOKEN.message,
        code: HTTP_RESPONSE.AUTH.INVALID_TOKEN.code,
      });
    }
    const ttl = decodedToken.exp - Math.floor(Date.now() / 1000);

    await this.redis.set(`blacklist:${token}`, JSON.stringify({ userId, token }), 'EX', ttl);
  }

  async verifyMail(payload: { data: IVerifyEmail }) {
    const label = '[verifyMail]';
    const { data } = payload;

    try {
      const isValidToken = await bcrypt.compare(data.email, data.token);

      if (!isValidToken) {
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          message: HTTP_RESPONSE.AUTH.INVALID_TOKEN.message,
          code: HTTP_RESPONSE.AUTH.INVALID_TOKEN.code,
        });
      }

      const user = await this.usersService.findOneByEmail({ email: data.email });

      if (!user) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.USER.NOT_FOUND.message,
          code: HTTP_RESPONSE.USER.NOT_FOUND.code,
        };
      }

      const updateUser = await this.usersService.updateUser({
        id: user.id,
        data: {
          status: StatusEnum.ACTIVE,
        },
      });

      return updateUser;
    } catch (error) {
      this.logger.error(`${label} error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: HTTP_RESPONSE.COMMON.INTERNAL_SERVER_ERROR.message,
        code: HTTP_RESPONSE.COMMON.INTERNAL_SERVER_ERROR.code,
      });
    }
  }

  async generateOtp(payload: { userId: string; size?: number }) {
    const { userId, size = envs.otpSize } = payload;
    const key = `reqOtp:${userId}`;
    const ttl = await this.redis.ttl(key);

    if (ttl === -2) {
      const pattern = `resOtp:*`;
      const keys = await this.redis.keys(pattern);
      const otpKeysWithUser = await Promise.all(
        keys.map(async (otpKey: string) => {
          const data = await this.redis.get(otpKey);
          const parsed = JSON.parse(data || '{}') as { userId: string; hashedToken: string };
          return parsed.userId === userId ? otpKey : null;
        })
      );

      const filteredOtpKeys = otpKeysWithUser.filter((key): key is string => key !== null);
      const otpCount = filteredOtpKeys.length;
      if (otpCount > envs.otpLimit) {
        const timeLimit = envs.otpTimeLimit;
        await this.redis.set(key, '', 'EX', timeLimit);
        return {
          otp: null,
          hashedToken: null,
          timeOut: null,
          timeLine: timeLimit,
        };
      }

      const otp = generateNumericOtp(size);
      const hashedToken = bcrypt.hashSync(otp, envs.bcryptSaltRound);
      const initTTL = envs.otpTimeout;
      await this.redis.set(
        `resOtp:${hashedToken}`,
        JSON.stringify({ userId, hashedToken }),
        'EX',
        initTTL
      );
      const ttlOtp = await this.redis.ttl(`resOtp:${hashedToken}`);
      return {
        otp: otp,
        hashedToken: hashedToken,
        timeOut: ttlOtp,
        timeLine: null,
      };
    } else if (ttl === -1) {
      await this.redis.del(key);
    } else {
      return { otp: null, hashedToken: null, timeOut: null, timeLine: ttl };
    }
  }

  async sendOtpToEmail(payload: { email: string }) {
    const { email } = payload;
    const user = await this.usersService.findOneByEmail({ email });

    if (!user) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
        data: {
          timeOut: undefined,
          timeLine: undefined,
        },
      };
    }

    const otp = await this.generateOtp({ userId: user.id });

    if (otp?.otp) {
      const updateUser = await this.usersService.updateUser({
        id: user.id,
        data: {
          tokens: otp.hashedToken,
        },
      });
      if (!updateUser) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: HTTP_RESPONSE.AUTH.TOKEN_ERROR.message,
          code: HTTP_RESPONSE.AUTH.TOKEN_ERROR.code,
          data: {
            timeOut: undefined,
            timeLine: undefined,
          },
        };
      }
      await this.mailService.sendMail({
        data: {
          from: { name: envs.appName, address: envs.mailFromAddress },
          recipients: [{ name: user.name, address: email }],
          subject: 'Welcome to WebShop',
          html: `
        <p>
          <strong>Hi ${user.name}!</strong>
          <span>Your OTP is <strong>${otp.otp}</strong>. <br/> Your verification code is valid for ${envs.otpTimeout / SECOND_DEFAULT} minutes. Never share your OTP with anyone.</span>
        </p>`,
        },
      });
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: HTTP_RESPONSE.AUTH.SEND_OTP_ERROR.message,
        code: HTTP_RESPONSE.AUTH.SEND_OTP_ERROR.code,
        data: {
          timeOut: undefined,
          timeLine: otp?.timeLine,
        },
      };
    }

    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.AUTH.SEND_OTP_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.SEND_OTP_SUCCESS.code,
      data: {
        timeOut: otp.timeOut,
        timeLine: undefined,
      },
    };
  }

  async verifyOTP(payload: { otp: string; email: string }) {
    const { otp, email } = payload;
    const user = await this.usersService.findOneByEmail({ email });
    if (!user) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }
    const checkOTP = await this.redis.get(`resOtp:${user.tokens}`);
    if (!checkOTP) {
      await this.usersService.updateUser({
        id: user.id,
        data: {
          tokens: undefined,
        },
      });
      return {
        status: HttpStatus.PAYMENT_REQUIRED,
        message: HTTP_RESPONSE.AUTH.VERIFY_OTP_EXPIRED.message,
        code: HTTP_RESPONSE.AUTH.VERIFY_OTP_EXPIRED.code,
        data: {
          userId: undefined,
        },
      };
    }
    const verify = await bcrypt.compare(otp, user.tokens);
    if (!verify) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: HTTP_RESPONSE.AUTH.VERIFY_OTP_FAIL.message,
        code: HTTP_RESPONSE.AUTH.VERIFY_OTP_FAIL.code,
        data: {
          userId: undefined,
        },
      };
    }
    await this.usersService.updateUser({
      id: user.id,
      data: {
        tokens: undefined,
      },
    });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.AUTH.VERIFY_OTP_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.VERIFY_OTP_SUCCESS.code,
      data: {
        userId: user.id,
      },
    };
  }

  async changeForgotPassword(payload: {
    data: IChangeForgotPassword;
    id: string;
  }): Promise<IChangePasswordRes> {
    const { data, id } = payload;

    const user = await this.usersService.updateForgotPassword({
      id,
      newPassword: data.password,
    });

    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.AUTH.CHANGE_PASSWORD_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.CHANGE_PASSWORD_SUCCESS.code,
      data: user,
    };
  }
}
