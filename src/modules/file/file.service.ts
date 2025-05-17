import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ActiveStorageBlobsEntity } from 'src/entities/active-storage-blobs.entity';
import { ActiveStorageAttachmentsEntity } from 'src/entities/active-storage-attachments.entity';
import { DUploadFile } from 'src/dto/file/upload-file.dto';
import { calculateChecksum, generateFileKey } from 'src/config/multer/multer.config';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { RecordTypeFileEnum } from 'src/common/enums/common.enum';
import { MediaService } from '../media/media.service';
import { envs } from 'src/config/envs';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(ActiveStorageBlobsEntity)
    private blobRepository: Repository<ActiveStorageBlobsEntity>,
    @InjectRepository(ActiveStorageAttachmentsEntity)
    private attachmentRepository: Repository<ActiveStorageAttachmentsEntity>,
    private readonly mediaService: MediaService,
    private dataSource: DataSource
  ) {}

  private readonly logger = new Logger(FileService.name, { timestamp: true });

  async uploadFile(
    payload: {
      file: Express.Multer.File;
      uploadFileDto: DUploadFile;
    },
    manager?: EntityManager
  ): Promise<ActiveStorageAttachmentsEntity> {
    const label = '[uploadFile]';
    const { file, uploadFileDto } = payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const repoManager = manager ?? queryRunner.manager;

    try {
      this.logger.debug(`${label} uploadFileDto -> ${JSON.stringify(uploadFileDto)}`);
      switch (uploadFileDto.recordType) {
        case RecordTypeFileEnum.MEDIA: {
          this.logger.debug(`${label} RecordTypeFileEnum.MEDIA`);
          const existedMedia = await this.mediaService.checkExistedMedia(
            {
              id: uploadFileDto.recordId,
            },
            repoManager
          );
          this.logger.debug(`${label} existedMedia -> ${JSON.stringify(existedMedia)}`);
          await this.mediaService.updateMedia({ id: existedMedia.id, file }, repoManager);
          break;
        }
        default:
          break;
      }

      const fileKey = generateFileKey(file.originalname);
      const checksum = calculateChecksum(file.path);

      const blob = new ActiveStorageBlobsEntity();
      blob.key = fileKey;
      blob.filename = file.filename;
      blob.contentType = file.mimetype;
      blob.byteSize = file.size;
      blob.checksum = checksum;
      blob.metadata = JSON.stringify({
        originalName: file.originalname,
        encoding: file.encoding,
      });

      this.logger.debug(`${label} blob -> ${JSON.stringify(blob)}`);
      const savedBlob = await repoManager.save(blob);

      const attachment = new ActiveStorageAttachmentsEntity();
      attachment.name = uploadFileDto.name;
      attachment.recordType = uploadFileDto.recordType;
      attachment.recordId = uploadFileDto.recordId;
      attachment.blobId = savedBlob.id;

      this.logger.debug(`${label} attachment -> ${JSON.stringify(attachment)}`);
      const savedAttachment = await repoManager.save(attachment);

      await queryRunner.commitTransaction();
      return savedAttachment;
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

  async getFileById(payload: {
    id: string;
  }): Promise<{ attachment: ActiveStorageAttachmentsEntity; blob: ActiveStorageBlobsEntity }> {
    const { id } = payload;
    const label = '[getFileById]';
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });
    this.logger.debug(`${label} attachment: ${JSON.stringify(attachment)}`);
    if (!attachment) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.FILE.ATTACHMENT_NOT_FOUND.message,
        code: HTTP_RESPONSE.FILE.ATTACHMENT_NOT_FOUND.code,
      });
    }

    const blob = await this.blobRepository.findOne({
      where: { id: attachment.blobId },
    });
    this.logger.debug(`${label} blob: ${JSON.stringify(blob)}`);
    if (!blob) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.FILE.BLOB_NOT_FOUND.message,
        code: HTTP_RESPONSE.FILE.BLOB_NOT_FOUND.code,
      });
    }

    return {
      attachment,
      blob,
    };
  }

  async getFilesByRecord(payload: {
    recordType: string;
    recordId: string;
  }): Promise<ActiveStorageAttachmentsEntity[]> {
    const label = '[getFilesByRecord]';
    const { recordType, recordId } = payload;
    const result = await this.attachmentRepository
      .createQueryBuilder('a') // a = attachments
      .leftJoinAndSelect('a.activeStorageBlob', 'blob')
      .where('a.recordType = :recordType', { recordType })
      .andWhere('a.recordId = :recordId', { recordId })
      .getMany();

    this.logger.debug(`${label} result: ${JSON.stringify(result)}`);

    return result;
  }

  async deleteFile(payload: { id: string }, manager?: EntityManager): Promise<void> {
    const label = '[deleteFile]';
    const { id } = payload;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const repoManager = manager ?? queryRunner.manager;

    try {
      const fileData = await this.getFileById({ id });
      this.logger.debug(`${label} fileData -> ${JSON.stringify(fileData)}`);

      await repoManager.softDelete(ActiveStorageAttachmentsEntity, { id });

      const otherAttachments = await this.attachmentRepository.count({
        where: { blobId: fileData.blob.id },
      });
      this.logger.debug(`${label} otherAttachments: ${otherAttachments}`);
      if (otherAttachments) {
        await repoManager.softDelete(ActiveStorageBlobsEntity, { id: fileData.blob.id });

        const filePath = path.join('uploads', fileData.blob.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.FILE.DELETE_ERROR.message;
      this.logger.error(`${label} error: ${errorMessage}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        code: HTTP_RESPONSE.FILE.DELETE_ERROR.code,
      });
    } finally {
      await queryRunner.release();
    }
  }

  getFilePath(key: string): string {
    return path.join('uploads', key);
  }

  getUploadedFileUrl(payload: { filename: string }): string {
    const { filename } = payload;
    return `${envs.appUrl}/${filename}`;
  }
}
