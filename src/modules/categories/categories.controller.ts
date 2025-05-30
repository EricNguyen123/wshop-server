import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Roles } from 'src/common/decorators/base.decorator';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { DCreateCategory } from 'src/dto/category/create-category.dto';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { DCategoryResSuccess } from 'src/dto/category/category-res-success.dto';
import { DQueryGetListCategory } from 'src/dto/category/query-get-list-category.dto';
import {
  DGetCategory,
  DGetListCategoriesResSuccess,
} from 'src/dto/category/get-list-categories-res-success.dto';
import { DParamsCategory } from 'src/dto/category/params-category.dto';
import { DUpdateCategory } from 'src/dto/category/update-category.dto';
import { DCategoryDeleteResSuccess } from 'src/dto/category/category-delete-res-success.dto';
import { DApplyProducts } from 'src/dto/category/apply-products.dto';
import { DDetailCategoryResSuccess } from 'src/dto/category/detail-category-res-success.dto';
import { DGetProduct } from 'src/dto/product/get-list-products-res-success.dto';

@ApiExtraModels(DGetCategory, DGetProduct)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  private readonly logger = new Logger(CategoriesController.name, { timestamp: true });

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Category create successfully',
    type: DCategoryResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  async createCategory(@Body() data: DCreateCategory) {
    const label = '[createCategory]';
    const result = await this.categoriesService.createCategory({ category: data });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.code,
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Category get list successfully',
    schema: {
      allOf: [
        {
          properties: {
            status: { type: 'number', example: 200 },
            message: { type: 'string', example: 'Get successfully' },
            code: { type: 'number', example: 1003 },
            data: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 1 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 1 },
                data: {
                  type: 'array',
                  items: { $ref: getSchemaPath(DGetCategory) },
                },
              },
            },
          },
        },
      ],
    },
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getListCategories(
    @Query() query: DQueryGetListCategory
  ): Promise<DGetListCategoriesResSuccess> {
    const label = '[getListCategories]';
    const result = await this.categoriesService.getCategories({ query });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Category update successfully',
    type: DCategoryResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put(':categoryId')
  async updateCategory(@Body() data: DUpdateCategory, @Param() params: DParamsCategory) {
    const label = '[updateCategory]';
    const { categoryId } = params;
    const result = await this.categoriesService.updateCategory({ category: data, categoryId });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.UPDATE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.UPDATE_SUCCESS.code,
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Delete banner successfully',
    type: DCategoryDeleteResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':categoryId')
  async deleteBanner(@Param() params: DParamsCategory): Promise<DCategoryDeleteResSuccess> {
    const { categoryId } = params;
    await this.categoriesService.deleteCategory({ categoryId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Category get detail successfully',
    type: DDetailCategoryResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get(':categoryId')
  async getDetailCategory(@Param() params: DParamsCategory) {
    const { categoryId } = params;
    const result = await this.categoriesService.getDetailCategory({ categoryId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Apply products for category successfully',
    schema: {
      allOf: [
        {
          properties: {
            status: { type: 'number', example: 200 },
            message: { type: 'string', example: 'Get successfully' },
            code: { type: 'number', example: 1003 },
            data: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 1 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 1 },
                data: {
                  type: 'array',
                  items: { $ref: getSchemaPath(DGetProduct) },
                },
              },
            },
          },
        },
      ],
    },
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post(':categoryId/apply-products')
  async applyProductsForCategory(@Param() params: DParamsCategory, @Body() data: DApplyProducts) {
    const { categoryId } = params;
    const { productIds } = data;
    const result = await this.categoriesService.applyProductsForCategory({
      categoryId,
      productIds,
    });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Remove products for category successfully',
    type: DCategoryDeleteResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':categoryId/remove-products')
  async removeProductsForCategory(@Param() params: DParamsCategory, @Body() data: DApplyProducts) {
    const { categoryId } = params;
    const { productIds } = data;
    await this.categoriesService.removeProductsForCategory({
      categoryId,
      productIds,
    });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }
}
