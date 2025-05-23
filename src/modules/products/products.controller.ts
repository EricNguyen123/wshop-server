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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/base.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { multerConfig } from 'src/config/multer/multer.config';
import { DCreateProduct } from 'src/dto/product/create-product.dto';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import {
  DMediaProductRes,
  DProductResSuccess,
  DProductUpdateResSuccess,
} from 'src/dto/product/product-res-success.dto';
import { DefaultNumberFiles } from 'src/constants/common';
import { DQueryGetListProduct } from 'src/dto/product/query-get-list-product.dto';
import {
  DGetListProductsResSuccess,
  DGetProduct,
} from 'src/dto/product/get-list-products-res-success.dto';
import { DUpdateProduct } from 'src/dto/product/update-product.dto';
import { DParamsProduct } from 'src/dto/product/params-product.dto';
import { DProductRes } from 'src/dto/product/product-res.dto';
import { DBaseGetListRes } from 'src/dto/base-get-list-res.dto';
import { DProductDeleteResSuccess } from 'src/dto/product/product-delete-res-success.dto';

@ApiExtraModels(DGetProduct, DMediaProductRes, DProductRes, DBaseGetListRes)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private readonly logger = new Logger(ProductsController.name, { timestamp: true });

  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        name: {
          type: 'string',
          example: 'Product 1',
        },
        code: {
          type: 'string',
          example: 'P1',
        },
        price: {
          type: 'number',
          example: 1000,
        },
        quantity: {
          type: 'number',
          example: 10,
        },
        quantityAlert: {
          type: 'number',
          example: 5,
        },
        orderUnit: {
          type: 'number',
          example: 1,
        },
        description: {
          type: 'string',
          example: 'Description',
        },
        status: {
          type: 'number',
          example: 1,
        },
        multiplicationRate: {
          type: 'number',
          example: 1,
        },
        discount: {
          type: 'number',
          example: 0,
        },
      },
      required: [
        'name',
        'code',
        'price',
        'quantity',
        'quantityAlert',
        'orderUnit',
        'description',
        'status',
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product create successfully',
    type: DProductResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files', DefaultNumberFiles, multerConfig))
  async createProduct(@UploadedFiles() files: Express.Multer.File[], @Body() data: DCreateProduct) {
    const label = '[createProduct]';
    const result = await this.productsService.createProduct({ files, product: data });
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
    description: 'Product get list successfully',
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
  @Get()
  async getListProducts(@Query() query: DQueryGetListProduct): Promise<DGetListProductsResSuccess> {
    const label = '[getListProducts]';
    const result = await this.productsService.getProducts({ query });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        name: {
          type: 'string',
          example: 'Product 1',
        },
        code: {
          type: 'string',
          example: 'P1',
        },
        price: {
          type: 'number',
          example: 1000,
        },
        quantity: {
          type: 'number',
          example: 10,
        },
        quantityAlert: {
          type: 'number',
          example: 5,
        },
        orderUnit: {
          type: 'number',
          example: 1,
        },
        description: {
          type: 'string',
          example: 'Description',
        },
        status: {
          type: 'number',
          example: 1,
        },
        multiplicationRate: {
          type: 'number',
          example: 1,
        },
        discount: {
          type: 'number',
          example: 0,
        },
        mediaIds: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product update successfully',
    type: DProductUpdateResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put(':productId')
  @UseInterceptors(FilesInterceptor('files', DefaultNumberFiles, multerConfig))
  async updateProduct(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() data: DUpdateProduct,
    @Param() params: DParamsProduct
  ) {
    const label = '[updateProduct]';
    const { productId } = params;
    const result = await this.productsService.updateProduct({ files, data, productId });
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
    description: 'Delete product successfully',
    type: DProductDeleteResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  async deleteProduct(@Param() params: DParamsProduct): Promise<DProductDeleteResSuccess> {
    const { productId } = params;
    await this.productsService.deleteProduct({ productId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Product get detail successfully',
    type: DProductResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get(':productId')
  async getDetailProduct(@Param() params: DParamsProduct): Promise<DProductResSuccess> {
    const { productId } = params;
    const result = await this.productsService.getDetailProduct({ productId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }
}
