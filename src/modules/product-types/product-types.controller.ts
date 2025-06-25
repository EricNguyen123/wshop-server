import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductTypesService } from './product-types.service';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/base.decorator';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DCreateProductType } from 'src/dto/product-types/create-product-type.dto';
import { DProductTypeResSuccess } from 'src/dto/product-types/product-type-res-success.dto';
import { DParamsProduct } from 'src/dto/product/params-product.dto';
import { DGetProductTypeRes } from 'src/dto/product-types/get-list-product-type-res-success.dto';
import { DParamsProductType } from 'src/dto/product-types/params-product-type.dto';
import { DProductDeleteResSuccess } from 'src/dto/product/product-delete-res-success.dto';

@ApiBearerAuth('access-token')
@ApiExtraModels(DGetProductTypeRes)
@Controller('product-types')
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  private readonly logger = new Logger(ProductTypesController.name, { timestamp: true });

  @ApiResponse({
    status: 200,
    description: 'Product type create successfully',
    type: DProductTypeResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  async createProductType(@Body() data: DCreateProductType) {
    const label = '[createProductType]';
    const result = await this.productTypesService.createProductTypes({ data });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.code,
      data: result,
    };
  }

  @ApiResponse({
    status: 200,
    description: 'Product type get successfully',
    schema: {
      allOf: [
        {
          properties: {
            status: { type: 'number', example: 200 },
            message: { type: 'string', example: 'Get successfully' },
            code: { type: 'number', example: 1003 },
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(DGetProductTypeRes) },
            },
          },
        },
      ],
    },
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get(':productId')
  async getProductTypes(@Param() params: DParamsProduct) {
    const label = '[getProductTypes]';
    const { productId } = params;
    const result = await this.productTypesService.getProductType({ productId });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }

  @ApiResponse({
    status: 200,
    description: 'Delete product type successfully',
    type: DProductDeleteResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':productTypeId')
  async deleteProduct(@Param() params: DParamsProductType): Promise<DProductDeleteResSuccess> {
    const { productTypeId } = params;
    await this.productTypesService.deleteProductType({ productTypeId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }
}
