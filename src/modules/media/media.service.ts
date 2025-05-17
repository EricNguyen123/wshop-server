import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaTypeEnum, ResourceMediaTypeEnum } from 'src/common/enums/common.enum';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { MediaItemsEntity } from 'src/entities/media-items.entity';
import { EntityManager, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { FileService } from '../file/file.service';

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
    const label = '[checkExistedMediaByResource]';
    const { resourceId, resourceType, mediaType } = payload;
    const mediaItems = await this.mediaItemsRepository.find({
      where: { resourceId, resourceType, mediaType },
    });
    this.logger.debug(`${label} mediaItems -> ${JSON.stringify(mediaItems)}`);

    return mediaItems;
  }
}
