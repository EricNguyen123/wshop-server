import { forwardRef, Module } from '@nestjs/common';
import { ProductTypesService } from './product-types.service';
import { ProductTypesController } from './product-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorTypesEntity } from 'src/entities/color-types.entity';
import { ProductTypesEntity } from 'src/entities/product-types.entity';
import { AuthModule } from '../auth/auth.module';
import { SizeTypesEntity } from 'src/entities/size-types.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { ProductsModule } from '../products/products.module';
import { ColorTypesModule } from '../color-types/color-types.module';
import { SizeTypesModule } from '../size-types/size-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ColorTypesEntity, ProductTypesEntity, SizeTypesEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => ColorTypesModule),
    forwardRef(() => SizeTypesModule),
  ],
  controllers: [ProductTypesController],
  providers: [ProductTypesService, JwtAuthGuard],
})
export class ProductTypesModule {}
