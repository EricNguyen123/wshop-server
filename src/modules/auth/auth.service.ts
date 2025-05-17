/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  HttpException,
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
  ILoginRes,
  ILogoutRes,
  IRefreshRes,
  IRegister,
  IVerifyEmail,
} from 'src/interfaces/auth.interface';
import { IUser } from 'src/interfaces/user.interface';
import { parseExpiresIn } from 'src/utils/jwt.util';
import { instanceToPlain } from 'class-transformer';
import { UserSerializer } from 'src/serializer/user/user.serializer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DQueryOtpEmail } from 'src/dto/auth/otp-email-query.dto';
import { BusinessTypeOtpEnum } from 'src/common/enums/common.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailerService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
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
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.REGISTER_ERROR.message,
        code: HTTP_RESPONSE.AUTH.REGISTER_ERROR.code,
      });
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
    if (user && user.deletedAt) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: HTTP_RESPONSE.USER.CONFLICT.message,
          code: HTTP_RESPONSE.USER.CONFLICT.code,
        },
        HttpStatus.BAD_REQUEST
      );
    }
    return user;
  }

  async validateCheckUser(payload: { data: ICheckUser }) {
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

    if (user.status === StatusEnum.NOT_ACTIVE) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.STATUS_ERROR.message,
        code: HTTP_RESPONSE.AUTH.STATUS_ERROR.code,
      });
    }

    return user;
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

  async login(payload: { id?: string }): Promise<ILoginRes> {
    const label = '[login]';

    const { id } = payload;
    this.logger.debug(`${label} userId -> ${id}`);

    if (!id) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.LOGIN_ERROR.message,
        code: HTTP_RESPONSE.AUTH.LOGIN_ERROR.code,
      });
    }

    const token = this.getJwtToken({ userId: id, expiresIn: parseExpiresIn(envs.jwtExpiresIn) });
    const refresh = this.getJwtToken({
      userId: id,
      expiresIn: parseExpiresIn(envs.jwtRefreshExpiresIn),
    });
    this.logger.debug(`${label} token -> ${token}`);
    this.logger.debug(`${label} refresh -> ${refresh}`);

    await this.setBlacklistToken({ userId: id, token });
    await this.setBlacklistRefreshToken({ userId: id, refresh });
    const updateUser = await this.updateToken({ id, token });
    this.logger.debug(`${label} updateUser -> ${JSON.stringify(updateUser)}`);

    const avatarUrl = await this.usersService.getAvatarUrl({ id: updateUser.id });

    return {
      user: { ...updateUser, avatarUrl },
      token,
      refreshToken: refresh,
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

    const token = this.getJwtToken({
      userId: user.id,
      expiresIn: parseExpiresIn(envs.jwtExpiresIn),
    });
    const refresh = this.getJwtToken({
      userId: user.id,
      expiresIn: parseExpiresIn(envs.jwtRefreshExpiresIn),
    });
    await this.setBlacklistToken({ userId: user.id, token });
    await this.setBlacklistRefreshToken({ userId: user.id, refresh });
    const updateUser = await this.updateToken({ id: user.id, token });

    const avatarUrl = await this.usersService.getAvatarUrl({ id: updateUser.id });

    return {
      user: { ...updateUser, avatarUrl },
      token,
      refreshToken: refresh,
    };
  }

  async logout(payload: { token: string }): Promise<ILogoutRes> {
    const { token } = payload;
    const user = await this.usersService.findOneByTokens({ tokens: token });

    if (!user) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }

    const updateUser = await this.usersService.updateUser({
      id: user?.id,
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

  private getJwtToken(payload: { userId: string; expiresIn?: string | number }): string {
    const label = '[getJwtToken]';
    const { userId, expiresIn } = payload;
    this.logger.debug(`${label} userId -> ${userId}`);
    this.logger.debug(`${label} expiresIn -> ${expiresIn}`);

    return this.jwtService.sign({ id: userId }, { expiresIn });
  }

  async getCurrentToken(id: string): Promise<string> {
    const user = await this.usersService.findOneById({ id });
    if (!user) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }
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
    const label = '[getDataInBlackList]';
    const { token } = payload;
    const data = await this.redis.get(`blacklist:${token}`);
    this.logger.debug(`${label} data -> ${JSON.stringify(data)}`);

    if (!data)
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.TOKEN_NOT_FOUND.message,
        code: HTTP_RESPONSE.AUTH.TOKEN_NOT_FOUND.code,
      });
    return JSON.parse(data) as { userId: string; token: string };
  }

  async getDataInBlackListRefresh(payload: {
    refresh: string;
  }): Promise<{ userId: string; refresh: string }> {
    const label = '[getDataInBlackListRefresh]';
    const { refresh } = payload;
    const data = await this.redis.get(`blacklistRefresh:${refresh}`);
    this.logger.debug(`${label} data -> ${JSON.stringify(data)}`);

    if (!data)
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.TOKEN_NOT_FOUND.message,
        code: HTTP_RESPONSE.AUTH.TOKEN_NOT_FOUND.code,
      });
    return JSON.parse(data) as { userId: string; refresh: string };
  }

  async setBlacklistToken(payload: { userId?: string; token: string }) {
    const label = '[setBlacklistToken]';
    const { userId, token } = payload;
    const decodedToken = this.jwtService.decode<{
      exp: number;
    }>(token);
    this.logger.debug(`${label} decodedToken -> ${JSON.stringify(decodedToken)}`);
    if (!decodedToken || !decodedToken.exp) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.INVALID_TOKEN.message,
        code: HTTP_RESPONSE.AUTH.INVALID_TOKEN.code,
      });
    }
    const ttl = decodedToken.exp - Math.floor(Date.now() / 1000);
    this.logger.debug(`${label} ttl -> ${ttl}`);
    if (ttl <= 0) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.TOKEN_EXPIRED.message,
        code: HTTP_RESPONSE.AUTH.TOKEN_EXPIRED.code,
      });
    }
    await this.redis.set(`blacklist:${token}`, JSON.stringify({ userId, token }), 'EX', ttl);
  }

  async setBlacklistRefreshToken(payload: { userId?: string; refresh: string }) {
    const label = '[setBlacklistRefreshToken]';
    const { userId, refresh } = payload;
    const decodedToken = this.jwtService.decode<{
      exp: number;
    }>(refresh);
    this.logger.debug(`${label} decodedToken -> ${JSON.stringify(decodedToken)}`);

    if (!decodedToken || !decodedToken.exp) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.INVALID_TOKEN.message,
        code: HTTP_RESPONSE.AUTH.INVALID_TOKEN.code,
      });
    }
    const ttl = decodedToken.exp - Math.floor(Date.now() / 1000);
    this.logger.debug(`${label} ttl -> ${ttl}`);

    if (ttl <= 0) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.TOKEN_EXPIRED.message,
        code: HTTP_RESPONSE.AUTH.TOKEN_EXPIRED.code,
      });
    }
    await this.redis.set(
      `blacklistRefresh:${refresh}`,
      JSON.stringify({ userId, refresh }),
      'EX',
      ttl
    );
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
    const label = '[sendOtpToEmail]';
    const { email } = payload;
    const user = await this.usersRepository.findOne({ where: { email }, withDeleted: true });
    this.logger.debug(`${label} user: ${JSON.stringify(user)}`);

    if (!user) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
        data: {
          timeOut: undefined,
          timeLine: undefined,
          email,
        },
      };
    }

    const otp = await this.generateOtp({ userId: user.id });

    if (otp?.otp) {
      const updateUser = await this.usersService.updateUserSkipDeleted({
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
            email,
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
          email,
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
        email,
      },
    };
  }

  async verifyOTP(payload: { otp: string; email: string; query?: DQueryOtpEmail }) {
    const { otp, email, query } = payload;
    let user: UserEntity | null = null;

    switch (query?.businessType) {
      case BusinessTypeOtpEnum.FORGOT_PASSWORD:
        user = await this.usersService.findOneByEmail({ email });
        break;
      case BusinessTypeOtpEnum.RESTORE:
        user = await this.usersService.findOneByEmailSkipDeleted({ email });
        break;
      default:
        break;
    }

    if (!user) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }
    const checkOTP = await this.redis.get(`resOtp:${user.tokens}`);
    if (!checkOTP) {
      await this.usersService.updateUserSkipDeleted({
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
    await this.usersService.updateUserSkipDeleted({
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

  async refreshToken(payload: { userId?: string; refresh: string }): Promise<IRefreshRes> {
    const label = '[refreshToken]';
    const { userId, refresh } = payload;

    if (!userId) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.LOGIN_ERROR.message,
        code: HTTP_RESPONSE.AUTH.LOGIN_ERROR.code,
      });
    }

    const data = await this.getDataInBlackListRefresh({ refresh });
    this.logger.debug(`${label} data -> ${JSON.stringify(data)}`);
    if (!data || data.userId !== userId) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.TOKEN_ERROR.message,
        code: HTTP_RESPONSE.AUTH.TOKEN_ERROR.code,
      });
    }

    const token = this.getJwtToken({ userId, expiresIn: parseExpiresIn(envs.jwtExpiresIn) });

    await this.setBlacklistToken({ userId, token });
    const updateUser = await this.updateToken({ id: userId, token });
    this.logger.debug(`${label} updateUser -> ${JSON.stringify(updateUser)}`);
    return {
      token,
    };
  }

  async createUser(payload: { user: IUser }) {
    const { user } = payload;

    const existedUser = await this.usersService.existedUserByEmail({
      email: user.email,
      ignoreError: true,
    });
    if (existedUser && !existedUser.deletedAt) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: HTTP_RESPONSE.USER.EXISTED_USER.message,
          code: HTTP_RESPONSE.USER.EXISTED_USER.code,
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (existedUser && existedUser.deletedAt) {
      await this.usersService.restoreUser({ id: existedUser.id });
    }

    const randomPassword = this.generateRandomPassword(LENGTH_PASSWORD_DEFAULT);
    user.encryptedPassword = bcrypt.hashSync(randomPassword, envs.bcryptSaltRound);
    const newUser =
      existedUser && existedUser.deletedAt
        ? await this.usersRepository.save({ id: existedUser.id, ...user, createdDate: new Date() })
        : await this.usersService.create({ user });

    const dataReq = {
      from: { name: envs.appName, address: envs.mailFromAddress },
      recipients: [{ name: newUser.name, address: newUser.email }],
      subject: 'Welcome to WebShop',
      html: `
          <p>
            <strong>Hi ${newUser.name}!</strong>
            <br/>
            <span>Username: ${newUser.email}</span>
            <br/>
            <span>Password: <strong><em>${randomPassword}</em></strong></span>
            <br/>
            <span>Please change your password for security.</span>
          </p>`,
    };

    await this.mailService.sendMail({ data: dataReq });

    const result = instanceToPlain(new UserSerializer(newUser));

    return result;
  }
}
