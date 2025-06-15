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
import { SizeTypesService } from './size-types.service';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/base.decorator';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DCreateSizeType } from 'src/dto/size-types/create-size-type.dto';
import { DSizeTypeRes, DSizeTypeResSuccess } from 'src/dto/size-types/size-type-res-success.dto';
import { DQueryGetListSizeTypes } from 'src/dto/size-types/query-get-list-size-types.dto';
import { DGetListSizeTypesResSuccess } from 'src/dto/size-types/get-list-size-types-res-success.dto';
import { DUpdateSizeType } from 'src/dto/size-types/update-size-type.dto';
import { DParamsSizeType } from 'src/dto/size-types/params-size-type.dto';

@Controller('size-types')
export class SizeTypesController {
  constructor(private readonly sizeTypesService: SizeTypesService) {}

  private readonly logger = new Logger(SizeTypesController.name, { timestamp: true });

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Size type create successfully',
    type: DSizeTypeResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  async createSizeType(@Body() data: DCreateSizeType) {
    const label = '[createSizeType]';
    const result = await this.sizeTypesService.createSizeTypes({ data });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.code,
      data: result,
    };
  }

  @ApiExtraModels(DSizeTypeRes)
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Size get list successfully',
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
                  items: { $ref: getSchemaPath(DSizeTypeRes) },
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
  async getSizeTypes(@Query() query: DQueryGetListSizeTypes): Promise<DGetListSizeTypesResSuccess> {
    const label = '[getSizeTypes]';
    const result = await this.sizeTypesService.getSizeTypes({ query });
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
    description: 'Size type update successfully',
    type: DSizeTypeResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put(':sizeTypeId')
  async updateSizeType(@Body() data: DUpdateSizeType, @Param() params: DParamsSizeType) {
    const label = '[updateSizeType]';
    const { sizeTypeId } = params;
    const result = await this.sizeTypesService.updateSizeTypes({ id: sizeTypeId, data });
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
    description: 'Size type delete successfully',
    type: DSizeTypeResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':sizeTypeId')
  async deleteSizeType(@Param() params: DParamsSizeType) {
    const label = '[deleteSizeType]';
    const { sizeTypeId } = params;
    const result = await this.sizeTypesService.deleteSizeTypes({ id: sizeTypeId });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }
}
