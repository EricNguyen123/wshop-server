import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IUser, IUserUpdate } from 'src/interfaces/user.interface';
import { IResponse } from 'src/interfaces/base.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>
  ) {}
  private readonly logger = new Logger(UsersService.name, { timestamp: true });

  async create(payload: { user: IUser }): Promise<UserEntity> {
    const { user } = payload;

    const existedUser = await this.existedUserByEmail({ email: user.email, ignoreError: true });
    if (existedUser) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: HTTP_RESPONSE.USER.EXISTED_USER.message,
          code: HTTP_RESPONSE.USER.EXISTED_USER.code,
        },
        HttpStatus.BAD_REQUEST
      );
    }
    return await this.usersRepository.save(user);
  }

  async existedUserByEmail(payload: {
    email: string;
    ignoreError?: boolean;
  }): Promise<UserEntity | null> {
    const label = '[existedUserByEmail]';
    const { email, ignoreError = false } = payload;

    const exitedUser = await this.usersRepository.findOne({ where: { email } });
    this.logger.debug(`${label} exitedUser: ${JSON.stringify(exitedUser)}`);

    if (!exitedUser && !ignoreError) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }
    return exitedUser;
  }

  async findOneById(payload: { id: string }): Promise<UserEntity> {
    const label = '[findOneById]';
    const { id } = payload;
    try {
      return await this.usersRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      this.logger.error(`${label} error: ${JSON.stringify(error)}`);
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }
  }

  async findOneByEmail(payload: { email: string }): Promise<UserEntity | null> {
    const { email } = payload;
    const user = await this.usersRepository.findOne({ where: { email } });

    return user;
  }

  async updateUser(payload: { id: string; data: IUserUpdate }): Promise<UserEntity> {
    const { id, data } = payload;
    const user = await this.findOneById({ id });

    Object.assign(user, {
      name: data.name ?? user.name,
      email: data.email ?? user.email,
      role: data.role ?? user.role,
      status: data.status ?? user.status,
      zipcode: data.zipcode ?? user.zipcode,
      phone: data.phone ?? user.phone,
      prefecture: data.prefecture ?? user.prefecture,
      city: data.city ?? user.city,
      street: data.street ?? user.street,
      building: data.building ?? user.building,
      currentSignInAt: data.currentSignInAt ?? user.currentSignInAt,
      lastSignInAt: data.lastSignInAt ?? user.lastSignInAt,
      tokens: data.tokens ?? '',
    });

    return await this.usersRepository.save(user);
  }

  async findOneByTokens(payload: { tokens: string }): Promise<UserEntity | undefined> {
    const label = '[findOneByTokens]';
    const { tokens } = payload;
    try {
      return await this.usersRepository.findOneOrFail({ where: { tokens } });
    } catch (error) {
      this.logger.error(`${label} error: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  async updatePassword(payload: {
    id: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<IUser | IResponse> {
    const { id, currentPassword, newPassword } = payload;
    const user = await this.findOneById({ id });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.encryptedPassword);
    if (!isPasswordValid) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: HTTP_RESPONSE.AUTH.PASSWORD_ERROR.message,
        code: HTTP_RESPONSE.AUTH.PASSWORD_ERROR.code,
      });
    }

    const salt = await bcrypt.genSalt();
    user.encryptedPassword = await bcrypt.hash(newPassword, salt);

    const userUpdate = await this.usersRepository.save(user);

    return userUpdate;
  }

  async updateForgotPassword(payload: {
    id: string;
    newPassword: string;
  }): Promise<IUser | IResponse> {
    const { id, newPassword } = payload;
    const user = await this.findOneById({ id });

    const salt = await bcrypt.genSalt();
    user.encryptedPassword = await bcrypt.hash(newPassword, salt);

    const userUpdate = await this.usersRepository.save(user);
    return userUpdate;
  }
}
