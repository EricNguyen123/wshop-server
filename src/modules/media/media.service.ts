import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MediaTypeEnum,
  RecordTypeFileEnum,
  ResourceMediaTypeEnum,
} from 'src/common/enums/common.enum';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { MediaItemsEntity } from 'src/entities/media-items.entity';
import { EntityManager, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { FileService } from '../file/file.service';
import { createSubquery } from 'src/common/helpers/query.helper';
import { ActiveStorageAttachmentsEntity } from 'src/entities/active-storage-attachments.entity';
import { ActiveStorageBlobsEntity } from 'src/entities/active-storage-blobs.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaItemsEntity)
    private mediaItemsRepository: Repository<MediaItemsEntity>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService
  ) {}

  private readonly logger = new Logger(MediaService.name, { timestamp: true });

  async checkExistedMedia(payload: { id: string }, manager?: EntityManager) {
    const label = '[checkExistedMedia]';
    const repo = manager ? manager.getRepository(MediaItemsEntity) : this.mediaItemsRepository;
    const { id } = payload;
    const mediaItem = await repo.findOne({
      where: { id },
    });

    this.logger.debug(`${label} mediaItem -> ${JSON.stringify(mediaItem)}`);
    if (!mediaItem) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: HTTP_RESPONSE.MEDIA.NOT_FOUND.message,
        code: HTTP_RESPONSE.MEDIA.NOT_FOUND.code,
      });
    }

    return mediaItem;
  }

  async createMedia(
    payload: {
      resourceId: string;
      resourceType: ResourceMediaTypeEnum;
      mediaType: string;
      mediaUrl?: string;
    },
    manager?: EntityManager
  ) {
    const label = '[createMedia]';
    const repo = manager ? manager.getRepository(MediaItemsEntity) : this.mediaItemsRepository;
    const { resourceId, resourceType, mediaType, mediaUrl } = payload;

    switch (resourceType) {
      case ResourceMediaTypeEnum.USER: {
        await this.usersService.findOneById({ id: resourceId });
        break;
      }
    }

    const mediaItem = await repo.save({
      resourceId,
      resourceType,
      mediaType,
      mediaUrl,
    });
    this.logger.debug(`${label} mediaItem -> ${JSON.stringify(mediaItem)}`);
    return mediaItem;
  }

  async updateMedia(payload: { id: string; file: Express.Multer.File }, manager?: EntityManager) {
    const label = '[updateMedia]';
    const { id, file } = payload;
    const repo = manager ? manager.getRepository(MediaItemsEntity) : this.mediaItemsRepository;

    const mediaItem = await this.checkExistedMedia({ id }, manager);

    mediaItem.mediaUrl = this.fileService.getUploadedFileUrl({
      filename: file.filename,
    });

    await repo.save(mediaItem);
    this.logger.debug(`${label} mediaItem -> ${JSON.stringify(mediaItem)}`);
    return mediaItem;
  }

  async deleteMedia(payload: { id: string }, manager?: EntityManager) {
    const label = '[deleteMedia]';
    const { id } = payload;
    const repo = manager ? manager.getRepository(MediaItemsEntity) : this.mediaItemsRepository;

    const mediaItem = await this.checkExistedMedia({ id }, manager);
    await repo.softDelete(mediaItem.id);
    this.logger.debug(`${label} mediaItem -> ${JSON.stringify(mediaItem)}`);
    return mediaItem;
  }

  async checkExistedMediaByResource(payload: {
    resourceId: string;
    resourceType: ResourceMediaTypeEnum;
    mediaType: MediaTypeEnum;
  }) {
    const label = '[checkExistedMediaByResource]';
    const { resourceId, resourceType, mediaType } = payload;
    const mediaItems = await this.mediaItemsRepository.find({
      where: { resourceId, resourceType, mediaType },
    });
    this.logger.debug(`${label} mediaItems -> ${JSON.stringify(mediaItems)}`);

    if (!mediaItems) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: HTTP_RESPONSE.MEDIA.NOT_FOUND.message,
        code: HTTP_RESPONSE.MEDIA.NOT_FOUND.code,
      });
    }
    return mediaItems;
  }

  async getMediaByResource(payload: {
    resourceId: string;
    resourceType: ResourceMediaTypeEnum;
    mediaType: MediaTypeEnum;
  }) {
    const label = '[getMediaByResource]';
    const { resourceId, resourceType, mediaType } = payload;
    const mediaItems = await this.mediaItemsRepository.find({
      where: { resourceId, resourceType, mediaType },
    });
    this.logger.debug(`${label} mediaItems -> ${JSON.stringify(mediaItems)}`);

    return mediaItems;
  }

  async getMediaById(payload: { id: string }) {
    const label = '[getMediaById]';
    const { id } = payload;

    const attachmentSubquery = createSubquery(ActiveStorageAttachmentsEntity, 'a')
      .select([{ field: 'a.name', alias: 'fileName' }])
      .addRawSelect('b.byte_size', 'fileSize')
      .leftJoin(ActiveStorageBlobsEntity, 'b', 'b.id = a.blobId')
      .relatedTo('m', 'recordId')
      .where('a.recordType = :recordType', { recordType: RecordTypeFileEnum.MEDIA })
      .as('attachments');

    const queryBuilder = this.mediaItemsRepository
      .createQueryBuilder('m')
      .select([
        'm.id as id',
        'm.resourceId as resourceId',
        'm.resourceType as resourceType',
        'm.mediaType as mediaType',
        'm.mediaUrl as mediaUrl',
      ])
      .addSelect(attachmentSubquery.build<MediaItemsEntity>(), 'attachments')
      .where('m.id = :id', { id });

    interface IMediaItemRaw {
      id: string;
      resourceId: string;
      resourceType: ResourceMediaTypeEnum;
      mediaType: string;
      mediaUrl: string;
      attachments: {
        fileName: string;
        fileSize: number;
      }[];
    }

    const mediaItem: IMediaItemRaw | undefined = await queryBuilder.getRawOne();
    this.logger.debug(`${label} mediaItem -> ${JSON.stringify(mediaItem)}`);

    return {
      id: mediaItem?.id,
      mediaUrl: mediaItem?.mediaUrl,
      fileName: mediaItem?.attachments?.[0]?.fileName,
      fileSize: mediaItem?.attachments?.[0]?.fileSize,
    };
  }
}
