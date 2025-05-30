import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { MediaModule } from '../media/media.module';
import { ProductsEntity } from 'src/entities/products.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { CategoryTinyEntity } from 'src/entities/category-tinies.entity';
import { CategoriesEntity } from 'src/entities/categories.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductsEntity, CategoryTinyEntity, CategoriesEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => FileModule),
    forwardRef(() => MediaModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, JwtAuthGuard],
})
export class ProductsModule {}
