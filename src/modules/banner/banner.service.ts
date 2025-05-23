import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BannersEntity } from 'src/entities/banners.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { FileService } from '../file/file.service';
import { MediaService } from '../media/media.service';
import { ICreateBanner, IUpdateBanner } from 'src/interfaces/banner.interface';
import {
  MediaTypeEnum,
  RecordTypeFileEnum,
  ResourceMediaTypeEnum,
} from 'src/common/enums/common.enum';
import { DefaultMediaUrl } from 'src/constants/common';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import * as fs from 'fs';
import { instanceToPlain } from 'class-transformer';
import { BannersSerializer } from 'src/serializer/banner/banner.serializer';
import { DQueryGetListBanner } from 'src/dto/banner/query-get-list-banner.dto';
import { paginate } from 'src/common/helpers/paginate.helper';
import { isErrorWithResponseCode } from 'src/utils/common.util';
import { MediaItemsEntity } from 'src/entities/media-items.entity';
import { convertISOStringToSQLDate } from 'src/utils/time.util';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(BannersEntity)
    private readonly bannersRepository: Repository<BannersEntity>,
    private readonly fileService: FileService,
    private readonly mediaService: MediaService,
    private dataSource: DataSource
  ) {}
  private readonly logger = new Logger(BannerService.name, { timestamp: true });

  async createBanner(payload: { file: Express.Multer.File; banner: ICreateBanner }) {
    const label = '[createBanner]';
    const { file, banner } = payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (banner.startDate > banner.endDate) {
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          message: HTTP_RESPONSE.BANNER.DATE_INVALID.message,
          code: HTTP_RESPONSE.BANNER.DATE_INVALID.code,
        });
      }

      // const overlappingBanner = await queryRunner.manager.findOne(BannersEntity, {
      //   where: [
      //     {
      //       numberOrder: banner.numberOrder,
      //       startDate: LessThanOrEqual(new Date(banner.endDate)),
      //       endDate: MoreThanOrEqual(new Date(banner.startDate)),
      //     },
      //   ],
      // });

      // if (overlappingBanner) {
      //   throw new BadRequestException({
      //     status: HttpStatus.BAD_REQUEST,
      //     message: HTTP_RESPONSE.BANNER.DATE_EXISTED.message,
      //     code: HTTP_RESPONSE.BANNER.DATE_EXISTED.code,
      //   });
      // }

      banner.startDate = convertISOStringToSQLDate(banner.startDate);
      banner.endDate = convertISOStringToSQLDate(banner.endDate);
      this.logger.debug(`${label} banner -> ${JSON.stringify(banner)}`);
      const bannerEntity = queryRunner.manager.create(BannersEntity, {
        ...banner,
        url: this.fileService.getUploadedFileUrl({
          filename: file.filename,
        }),
      });
      const existedBanner = await queryRunner.manager.save(bannerEntity);
      this.logger.debug(`${label} existedBanner -> ${JSON.stringify(existedBanner)}`);

      const media = await this.mediaService.createMedia(
        {
          resourceId: existedBanner.id,
          resourceType: ResourceMediaTypeEnum.BANNER,
          mediaType: MediaTypeEnum.BANNER_IMAGE,
          mediaUrl: DefaultMediaUrl.BANNER,
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

      return instanceToPlain(new BannersSerializer(existedBanner));
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.FILE.UPLOAD_ERROR.message;
      const defaultCode = HTTP_RESPONSE.FILE.UPLOAD_ERROR.code;
      let errorCode = defaultCode;

      if (isErrorWithResponseCode(error)) {
        errorCode = error.response.code;
      }

      this.logger.error(`${label} error: ${errorMessage}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async getBanners(payload: { query: DQueryGetListBanner }) {
    const label = '[getBanners]';
    const { textSearch, startDate, endDate, ...pagination } = payload.query;

    const queryBuilder = this.bannersRepository
      .createQueryBuilder('b') // b = banners
      .select([
        'b.id as id',
        'b.url as url',
        'b.descriptions as descriptions',
        'b.startDate as startDate',
        'b.endDate as endDate',
        'b.numberOrder as numberOrder',
      ]);

    const conditions: Record<string, any> = {};

    const valueSearch = textSearch?.trim();
    if (valueSearch) {
      conditions.descriptions = ILike(`%${valueSearch}%`);
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('(b.endDate >= :startDate AND b.endDate <= :endDate)', {
        startDate,
        endDate,
      });
    }

    if (Object.keys(conditions).length > 0) {
      queryBuilder.andWhere(conditions);
    }

    const result = await paginate(queryBuilder, pagination);
    this.logger.debug(`${label} result: ${JSON.stringify(result)}`);

    return {
      ...result,
      data: result.data.map((b: Partial<BannersEntity>) => {
        const bannerData = instanceToPlain(new BannersSerializer(b));
        return bannerData;
      }),
    };
  }

  async updateBanner(payload: { data: IUpdateBanner; bannerId: string }) {
    const label = '[updateBanner]';
    const { data, bannerId } = payload;
    const existedBanner = await this.bannersRepository.findOneBy({ id: bannerId });
    this.logger.debug(`${label} existedBanner: ${JSON.stringify(existedBanner)}`);

    if (!existedBanner) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.BANNER.NOT_FOUND.message,
        code: HTTP_RESPONSE.BANNER.NOT_FOUND.code,
      });
    }

    if (data.startDate) {
      data.startDate = convertISOStringToSQLDate(data.startDate);
    }
    if (data.endDate) {
      data.endDate = convertISOStringToSQLDate(data.endDate);
    }
    this.logger.debug(`${label} banner -> ${JSON.stringify(data)}`);
    Object.assign(existedBanner, {
      descriptions: data.descriptions ?? existedBanner.descriptions,
      startDate: data.startDate ?? existedBanner.startDate,
      endDate: data.endDate ?? existedBanner.endDate,
      numberOrder: data.numberOrder ?? existedBanner.numberOrder,
    });

    const result = await this.bannersRepository.save(existedBanner);
    return instanceToPlain(new BannersSerializer(result));
  }

  async deleteBanner(payload: { bannerId: string }) {
    const { bannerId } = payload;
    const label = '[deleteBanner]';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existedBanner = await this.bannersRepository.findOneBy({ id: bannerId });
      this.logger.debug(`${label} existedBanner: ${JSON.stringify(existedBanner)}`);
      if (!existedBanner) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.BANNER.NOT_FOUND.message,
          code: HTTP_RESPONSE.BANNER.NOT_FOUND.code,
        });
      }

      await queryRunner.manager.softDelete(BannersEntity, { id: bannerId });

      const existedMedias = await this.mediaService.getMediaByResource({
        resourceId: bannerId,
        resourceType: ResourceMediaTypeEnum.BANNER,
        mediaType: MediaTypeEnum.BANNER_IMAGE,
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
          resourceId: bannerId,
          resourceType: ResourceMediaTypeEnum.BANNER,
          mediaType: MediaTypeEnum.BANNER_IMAGE,
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

  async getDetailBanner(payload: { bannerId: string }) {
    const { bannerId } = payload;
    const label = '[getDetailBanner]';
    const existedBanner = await this.bannersRepository.findOneBy({ id: bannerId });
    this.logger.debug(`${label} existedBanner: ${JSON.stringify(existedBanner)}`);
    if (!existedBanner) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.BANNER.NOT_FOUND.message,
        code: HTTP_RESPONSE.BANNER.NOT_FOUND.code,
      });
    }

    return instanceToPlain(new BannersSerializer(existedBanner));
  }
}
