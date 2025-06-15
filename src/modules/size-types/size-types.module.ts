import { forwardRef, Module } from '@nestjs/common';
import { SizeTypesService } from './size-types.service';
import { SizeTypesController } from './size-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTypesEntity } from 'src/entities/product-types.entity';
import { SizeTypesEntity } from 'src/entities/size-types.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([SizeTypesEntity, ProductTypesEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SizeTypesController],
  providers: [SizeTypesService, JwtAuthGuard],
})
export class SizeTypesModule {}
