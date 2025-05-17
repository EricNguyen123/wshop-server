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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/base.decorator';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer/multer.config';
import { DCreateBanner } from 'src/dto/banner/create-banner.dto';
import { DBannerResSuccess } from 'src/dto/banner/banner-res-success.dto';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DQueryGetListBanner } from 'src/dto/banner/query-get-list-banner.dto';
import { DBannerRes } from 'src/dto/banner/banner-res.dto';
import { DGetListBannersResSuccess } from 'src/dto/banner/get-list-banners-res-success.dto';
import { DUpdateBanner } from 'src/dto/banner/update-banner.dto';
import { DParamsBanner } from 'src/dto/banner/params-banner.dto';
import { DBannerDeleteResSuccess } from 'src/dto/banner/banner-delete-res-success.dto';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  private readonly logger = new Logger(BannerController.name, { timestamp: true });

  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        descriptions: { type: 'string', example: 'Description' },
        startDate: { type: 'string', example: '2025-04-10 15:34:54.726739' },
        endDate: { type: 'string', example: '2025-04-10 15:34:54.726739' },
        numberOrder: { type: 'number', example: 1 },
      },
      required: ['file', 'startDate', 'endDate', 'numberOrder'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Banner create successfully',
    type: DBannerResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async createBanner(@UploadedFile() file: Express.Multer.File, @Body() data: DCreateBanner) {
    const label = '[createBanner]';
    const result = await this.bannerService.createBanner({ file, banner: data });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.code,
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiExtraModels(DBannerRes)
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
                  items: { $ref: getSchemaPath(DBannerRes) },
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
  async getListBanners(@Query() query: DQueryGetListBanner): Promise<DGetListBannersResSuccess> {
    const label = '[getListBanners]';
    const result = await this.bannerService.getBanners({ query });
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
    description: 'Banner update successfully',
    type: DBannerResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put(':bannerId')
  async updateBanner(@Body() data: DUpdateBanner, @Param() params: DParamsBanner) {
    const label = '[updateBanner]';
    const { bannerId } = params;
    this.logger.debug(`${label} data -> ${JSON.stringify(data)}`);
    const result = await this.bannerService.updateBanner({ data, bannerId });
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
    type: DBannerDeleteResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':bannerId')
  async deleteBanner(@Param() params: DParamsBanner): Promise<DBannerDeleteResSuccess> {
    const { bannerId } = params;
    await this.bannerService.deleteBanner({ bannerId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Banner get detail successfully',
    type: DBannerResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get(':bannerId')
  async getDetailBanner(@Param() params: DParamsBanner): Promise<DBannerResSuccess> {
    const { bannerId } = params;
    const result = await this.bannerService.getDetailBanner({ bannerId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }
}
