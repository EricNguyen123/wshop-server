import { forwardRef, Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersEntity } from 'src/entities/banners.entity';
import { FileModule } from '../file/file.module';
import { MediaModule } from '../media/media.module';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BannersEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => FileModule),
    forwardRef(() => MediaModule),
  ],
  controllers: [BannerController],
  providers: [JwtAuthGuard, BannerService],
})
export class BannerModule {}
