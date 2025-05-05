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
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IUser, IUserUpdate } from 'src/interfaces/user.interface';
import { IResponse } from 'src/interfaces/base.interface';
import { instanceToPlain } from 'class-transformer';
import { UserSerializer } from 'src/serializer/user/user.serializer';
import { DQueryGetListUser } from 'src/dto/user/query-get-list-user.dto';
import { paginate } from 'src/common/helpers/paginate.helper';

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
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: HTTP_RESPONSE.USER.CONFLICT.message,
          code: HTTP_RESPONSE.USER.CONFLICT.code,
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

    const exitedUser = await this.usersRepository.findOne({ where: { email }, withDeleted: true });
    this.logger.debug(`${label} exitedUser: ${JSON.stringify(exitedUser)}`);

    if (!exitedUser && !ignoreError) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }

    if (exitedUser?.deletedAt && !ignoreError) {
      throw new NotFoundException({
        status: HttpStatus.CONFLICT,
        message: HTTP_RESPONSE.USER.CONFLICT.message,
        code: HTTP_RESPONSE.USER.CONFLICT.code,
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

  async findOneByIdSkipDeleted(payload: { id: string }): Promise<UserEntity> {
    const label = '[findOneById]';
    const { id } = payload;
    try {
      return await this.usersRepository.findOneOrFail({ where: { id }, withDeleted: true });
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

  async findOneByEmailSkipDeleted(payload: { email: string }): Promise<UserEntity | null> {
    const { email } = payload;
    const user = await this.usersRepository.findOne({ where: { email }, withDeleted: true });

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

  async updateUserSkipDeleted(payload: { id: string; data: IUserUpdate }): Promise<UserEntity> {
    const { id, data } = payload;
    const user = await this.findOneByIdSkipDeleted({ id });

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

  async getDetail(payload: { id: string }) {
    const { id } = payload;
    const existedUser = await this.findOneById({ id });

    const result = instanceToPlain(new UserSerializer(existedUser));
    return result;
  }

  async getUsers(payload: { query: DQueryGetListUser }) {
    const { textSearch, ...pagination } = payload.query;
    const queryBuilder = this.usersRepository.createQueryBuilder('u'); // u = users

    const valueSearch = textSearch?.trim();
    if (valueSearch) {
      queryBuilder.where([
        { name: ILike(`%${valueSearch}%`) },
        { email: ILike(`%${valueSearch}%`) },
        { phone: ILike(`%${valueSearch}%`) },
      ]);
    }

    const result = await paginate(queryBuilder, pagination);

    return {
      ...result,
      data: result.data.map((u) => instanceToPlain(new UserSerializer(u))),
    };
  }

  async deleteUser(payload: { id: string }) {
    const label = '[deleteUser]';
    const { id } = payload;

    const existedUser = await this.findOneById({ id });
    this.logger.debug(`${label} existedUser: ${JSON.stringify(existedUser)}`);
    if (!existedUser) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.USER.NOT_FOUND.message,
        code: HTTP_RESPONSE.USER.NOT_FOUND.code,
      });
    }
    await this.usersRepository.softDelete(id);

    return true;
  }

  async restoreUser(payload: { id: string }) {
    const label = '[restoreUser]';
    const { id } = payload;

    const user = await this.usersRepository.restore(id);
    this.logger.debug(`${label} user: ${JSON.stringify(user)}`);

    return user;
  }
}
