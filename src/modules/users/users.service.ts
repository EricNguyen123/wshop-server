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
import { DataSource, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IUser, IUserUpdate } from 'src/interfaces/user.interface';
import { IResponse } from 'src/interfaces/base.interface';
import { instanceToPlain } from 'class-transformer';
import { UserSerializer } from 'src/serializer/user/user.serializer';
import { DQueryGetListUser } from 'src/dto/user/query-get-list-user.dto';
import { paginate } from 'src/common/helpers/paginate.helper';
import { FileService } from '../file/file.service';
import {
  MediaTypeEnum,
  RecordTypeFileEnum,
  ResourceMediaTypeEnum,
} from 'src/common/enums/common.enum';
import { MediaService } from '../media/media.service';
import { DefaultMediaUrl } from 'src/constants/common';
import * as fs from 'fs';
import { MediaItemsEntity } from 'src/entities/media-items.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly fileService: FileService,
    private readonly mediaService: MediaService,
    private dataSource: DataSource
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

    const avatarUrl = await this.getAvatarUrl({ id });

    const result = instanceToPlain(new UserSerializer(existedUser));
    return { ...result, avatarUrl };
  }

  async getAvatarUrl(payload: { id: string }) {
    const { id } = payload;
    const existedMedias = await this.mediaService.getMediaByResource({
      resourceId: id,
      resourceType: ResourceMediaTypeEnum.USER,
      mediaType: MediaTypeEnum.USER_AVATAR,
    });

    const avatarUrl = existedMedias.length ? existedMedias[0].mediaUrl : '';

    return avatarUrl;
  }

  async getUsers(payload: { query: DQueryGetListUser }) {
    const label = '[getUsers]';
    const { textSearch, ...pagination } = payload.query;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('u')
      .leftJoin(
        MediaItemsEntity,
        'media',
        'u.id = media.resourceId AND media.resourceType = :resourceType AND media.mediaType = :mediaType',
        {
          resourceType: ResourceMediaTypeEnum.USER,
          mediaType: MediaTypeEnum.USER_AVATAR,
        }
      )
      .select([
        'u.id as id',
        'u.name as name',
        'u.email as email',
        'u.role as role',
        'u.status as status',
        'u.zipcode as zipcode',
        'u.phone as phone',
        'u.prefecture as prefecture',
        'u.city as city',
        'u.street as street',
        'u.building as building',
        'u.currentSignInAt as currentSignInAt',
        'u.lastSignInAt as lastSignInAt',
      ])
      .addSelect(['media.mediaUrl as avatarUrl']);

    const valueSearch = textSearch?.trim();
    if (valueSearch) {
      queryBuilder.where([
        { name: ILike(`%${valueSearch}%`) },
        { email: ILike(`%${valueSearch}%`) },
        { phone: ILike(`%${valueSearch}%`) },
      ]);
    }

    const result = await paginate(queryBuilder, pagination);
    this.logger.debug(`${label} result: ${JSON.stringify(result)}`);

    return {
      ...result,
      data: result.data.map((u: Partial<UserEntity>) => {
        const userData = instanceToPlain(new UserSerializer(u));
        return userData;
      }),
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

  async uploadAvatar(payload: { userId: string; file: Express.Multer.File }) {
    const { userId, file } = payload;
    const label = '[uploadAvatar]';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.findOneById({ id: userId });

      const existedMedias = await this.mediaService.getMediaByResource({
        resourceId: userId,
        resourceType: ResourceMediaTypeEnum.USER,
        mediaType: MediaTypeEnum.USER_AVATAR,
      });

      if (existedMedias.length) {
        const existedFiles = await Promise.all(
          existedMedias.map(async (media) => {
            const file = await this.fileService.getFilesByRecord({
              recordType: RecordTypeFileEnum.MEDIA,
              recordId: media.id,
            });

            return file;
          })
        );

        await Promise.all(
          existedFiles.map(async (files) => {
            await Promise.all(
              files.map(async (file) => {
                await this.fileService.deleteFile({ id: file.id }, queryRunner.manager);
              })
            );
          })
        );

        await queryRunner.manager.softDelete(MediaItemsEntity, {
          resourceId: userId,
          resourceType: ResourceMediaTypeEnum.USER,
          mediaType: MediaTypeEnum.USER_AVATAR,
        });
      }

      const media = await this.mediaService.createMedia(
        {
          resourceId: userId,
          resourceType: ResourceMediaTypeEnum.USER,
          mediaType: MediaTypeEnum.USER_AVATAR,
          mediaUrl: DefaultMediaUrl.AVATAR,
        },
        queryRunner.manager
      );

      this.logger.debug(`${label} media -> ${JSON.stringify(media)}`);

      await this.fileService.uploadFile(
        {
          file,
          uploadFileDto: {
            name: file.originalname,
            recordType: RecordTypeFileEnum.MEDIA,
            recordId: media.id,
          },
        },
        queryRunner.manager
      );

      const existedMedia = await this.mediaService.checkExistedMedia(
        { id: media.id },
        queryRunner.manager
      );
      this.logger.debug(`${label} existedMedia -> ${JSON.stringify(existedMedia)}`);

      await queryRunner.commitTransaction();

      return existedMedia;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.FILE.UPLOAD_ERROR.message;
      this.logger.error(`${label} error: ${errorMessage}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        code: HTTP_RESPONSE.FILE.UPLOAD_ERROR.code,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAvatar(payload: { userId: string }) {
    const { userId } = payload;
    const label = '[deleteAvatar]';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.findOneById({ id: userId });

      const existedMedias = await this.mediaService.getMediaByResource({
        resourceId: userId,
        resourceType: ResourceMediaTypeEnum.USER,
        mediaType: MediaTypeEnum.USER_AVATAR,
      });

      if (existedMedias.length) {
        const existedFiles = await Promise.all(
          existedMedias.map(async (media) => {
            const file = await this.fileService.getFilesByRecord({
              recordType: RecordTypeFileEnum.MEDIA,
              recordId: media.id,
            });

            return file;
          })
        );

        await Promise.all(
          existedFiles.map(async (files) => {
            await Promise.all(
              files.map(async (file) => {
                await this.fileService.deleteFile({ id: file.id }, queryRunner.manager);
              })
            );
          })
        );

        await queryRunner.manager.softDelete(MediaItemsEntity, {
          resourceId: userId,
          resourceType: ResourceMediaTypeEnum.USER,
          mediaType: MediaTypeEnum.USER_AVATAR,
        });
      }

      await queryRunner.commitTransaction();
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.FILE.UPLOAD_ERROR.message;
      this.logger.error(`${label} error: ${errorMessage}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        code: HTTP_RESPONSE.FILE.UPLOAD_ERROR.code,
      });
    } finally {
      await queryRunner.release();
    }
  }
}
