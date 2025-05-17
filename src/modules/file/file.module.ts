import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { multerConfig } from 'src/config/multer/multer.config';
import { ActiveStorageAttachmentsEntity } from 'src/entities/active-storage-attachments.entity';
import { ActiveStorageBlobsEntity } from 'src/entities/active-storage-blobs.entity';
import { MediaItemsEntity } from 'src/entities/media-items.entity';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActiveStorageBlobsEntity,
      ActiveStorageAttachmentsEntity,
      MediaItemsEntity,
    ]),
    MulterModule.register(multerConfig),
    forwardRef(() => MediaModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
