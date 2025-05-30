import { forwardRef, Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesEntity } from 'src/entities/categories.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { CategoryTinyEntity } from 'src/entities/category-tinies.entity';
import { ProductsEntity } from 'src/entities/products.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoriesEntity, CategoryTinyEntity, ProductsEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtAuthGuard],
})
export class CategoriesModule {}
