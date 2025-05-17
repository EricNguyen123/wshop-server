import { forwardRef, Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaItemsEntity } from 'src/entities/media-items.entity';
import { UsersModule } from '../users/users.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaItemsEntity]),
    forwardRef(() => UsersModule),
    forwardRef(() => FileModule),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [TypeOrmModule.forFeature([MediaItemsEntity]), MediaService],
})
export class MediaModule {}
