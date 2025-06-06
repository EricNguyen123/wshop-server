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
import { ColorTypesService } from './color-types.service';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/base.decorator';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DCreateColorType } from 'src/dto/color-types/create-color-type.dto';
import {
  DColorTypeRes,
  DColorTypeResSuccess,
} from 'src/dto/color-types/color-type-res-success.dto';
import { DGetListColorTypesResSuccess } from 'src/dto/color-types/get-list-color-types-res-success.dto';
import { DUpdateColorType } from 'src/dto/color-types/update-color-type.dto';
import { DParamsColorType } from 'src/dto/color-types/params-color-type.dto';
import { DQueryGetListColorTypes } from 'src/dto/color-types/query-get-list-color-types.dto';

@Controller('color-types')
export class ColorTypesController {
  constructor(private readonly colorTypesService: ColorTypesService) {}

  private readonly logger = new Logger(ColorTypesController.name, { timestamp: true });

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Color type create successfully',
    type: DColorTypeResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  async createColorType(@Body() data: DCreateColorType) {
    const label = '[createColorType]';
    const result = await this.colorTypesService.createColorTypes({ data });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.code,
      data: result,
    };
  }

  @ApiExtraModels(DColorTypeRes)
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Banner get list successfully',
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
                  items: { $ref: getSchemaPath(DColorTypeRes) },
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
  async getColorTypes(
    @Query() query: DQueryGetListColorTypes
  ): Promise<DGetListColorTypesResSuccess> {
    const label = '[getColorTypes]';
    const result = await this.colorTypesService.getColorTypes({ query });
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
    description: 'Color type update successfully',
    type: DColorTypeResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put(':colorTypeId')
  async updateColorType(@Body() data: DUpdateColorType, @Param() params: DParamsColorType) {
    const label = '[updateColorType]';
    const { colorTypeId } = params;
    const result = await this.colorTypesService.updateColorTypes({ id: colorTypeId, data });
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
    description: 'Color type delete successfully',
    type: DColorTypeResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':colorTypeId')
  async deleteColorType(@Param() params: DParamsColorType) {
    const label = '[deleteColorType]';
    const { colorTypeId } = params;
    const result = await this.colorTypesService.deleteColorTypes({ id: colorTypeId });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }
}
