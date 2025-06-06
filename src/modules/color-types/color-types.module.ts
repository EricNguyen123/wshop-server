import { forwardRef, Module } from '@nestjs/common';
import { ColorTypesService } from './color-types.service';
import { ColorTypesController } from './color-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ColorTypesEntity } from 'src/entities/color-types.entity';
import { ProductTypesEntity } from 'src/entities/product-types.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ColorTypesEntity, ProductTypesEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ColorTypesController],
  providers: [ColorTypesService, JwtAuthGuard],
})
export class ColorTypesModule {}
