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
import { UsersService } from './users.service';
import { DParamsUser } from 'src/dto/user/params-user.dto';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/base.decorator';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { DUserResSuccess } from 'src/dto/user/user-res-success.dto';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DUserUpdate } from 'src/dto/user/user-update.dto';
import { DQueryGetListUser } from 'src/dto/user/query-get-list-user.dto';
import { DGetListUsersResSuccess } from 'src/dto/user/get-list-users-res-success.dto';
import { DUserRes } from 'src/dto/user/user-res.dto';
import { AuthService } from '../auth/auth.service';
import { DUserCreate } from 'src/dto/user/user-create.dto';
import { DUserDeleteResSuccess } from 'src/dto/user/user-delete-res-success.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}
  private readonly logger = new Logger(UsersController.name, { timestamp: true });

  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'User successfully change password',
    type: DUserResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR, ValidRolesEnum.USER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getDetail(@Param() params: DParamsUser): Promise<DUserResSuccess> {
    const label = '[getDetail]';
    const { userId } = params;
    this.logger.debug(`${label} userId -> ${userId}`);
    const result = await this.usersService.getDetail({ id: userId });

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
    description: 'User updated successfully',
    type: DUserResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR, ValidRolesEnum.USER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put(':userId')
  async updateUser(
    @Body() data: DUserUpdate,
    @Param() params: DParamsUser
  ): Promise<DUserResSuccess> {
    const label = '[updateUser]';
    const { userId } = params;
    const result = await this.usersService.updateUser({
      id: userId,
      data,
    });
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
    description: 'User deleted successfully',
    type: DUserDeleteResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async deleteUser(@Param() params: DParamsUser): Promise<DUserDeleteResSuccess> {
    const { userId } = params;
    await this.usersService.deleteUser({ id: userId });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiExtraModels(DUserRes)
  @ApiResponse({
    status: 200,
    description: 'User get list successfully',
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
                  items: { $ref: getSchemaPath(DUserRes) },
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
  async getListUsers(@Query() query: DQueryGetListUser): Promise<DGetListUsersResSuccess> {
    const label = '[getListUsers]';
    const result = await this.usersService.getUsers({ query });
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
    description: 'User created successfully',
    type: DUserResSuccess,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  async createUser(@Body() data: DUserCreate): Promise<DUserResSuccess> {
    const label = '[createUser]';
    const result = await this.authService.createUser({ user: data });
    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.CREATE_SUCCESS.code,
      data: result,
    };
  }
}
