import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ApiResponse } from '@nestjs/swagger';
import { DRegister } from 'src/dto/auth/register.dto';
import { LocalAuthGuard } from './guards/local-guards/local-auth.guard';
import { DLogin } from 'src/dto/auth/login.dto';
import { DLoginResSuccess } from 'src/dto/auth/login-res-success.dto';
import { UserSerializer } from 'src/serializer/user/user.serializer';
import { instanceToPlain } from 'class-transformer';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { Public } from 'src/common/decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { ZodValidationPipe } from 'src/validations/zod-validation-pipe';
import { registerSchema } from 'src/validations/auth/register.validation';
import { DLoginGoogle } from 'src/dto/auth/login-google.dto';
import { DGoogleCallback } from 'src/dto/auth/google-callback.dto';
import { urlCallback } from 'src/config/oauth/url-callback.config';
import { callbackLoginSchema } from 'src/validations/auth/callback-login.validation';
import { DLogoutRes } from 'src/dto/auth/logout-res.dto';
import { DLogout } from 'src/dto/auth/logout.dto';
import { DChangePasswordRes } from 'src/dto/auth/change-password-res.dto';
import { Roles } from 'src/common/decorators/base.decorator';
import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { RolesGuard } from './guards/roles/roles.guard';
import { JwtAuthGuard } from './guards/jwt-guards/jwt-auth.guard';
import { changePasswordSchema } from 'src/validations/auth/change-password.validation';
import { DRegisterResSuccess } from 'src/dto/auth/register-res-success.dto';
import { DParamsUser } from 'src/dto/user/params-user.dto';
import { DVerifyMailRes } from 'src/dto/auth/verify-mail-res.dto';
import { DVerifyMail } from 'src/dto/auth/verify-mail.dto';
import { envs } from 'src/config/envs';
import { verifyEmailSchema } from 'src/validations/auth/verify-email.validation';
import { DOtpEmail } from 'src/dto/auth/otp-email.dto';
import { DVerifyOtpRes } from 'src/dto/auth/verify-otp-res.dto';
import { DVerifyOtp } from 'src/dto/auth/verify-otp';
import { DChangeForgotPassword } from 'src/dto/auth/change-forgot-password.dto';
import { DOtpEmailRes } from 'src/dto/auth/otp-email-res.dto';
import { DChangePassword } from 'src/dto/auth/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: DRegisterResSuccess,
  })
  @UsePipes(new ZodValidationPipe(registerSchema))
  @Post('register')
  async register(@Body() data: DRegister): Promise<DRegisterResSuccess> {
    const result = await this.authService.register({ data });
    return {
      status: HttpStatus.CREATED,
      message: HTTP_RESPONSE.AUTH.REGISTER_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.REGISTER_SUCCESS.code,
      data: result,
    };
  }

  @ApiResponse({
    status: 200,
    description: 'User successfully login',
    type: DLoginResSuccess,
  })
  @UseGuards(LocalAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('login')
  async login(@Body() data: DLogin): Promise<DLoginResSuccess> {
    const result = await this.authService.login({ data });
    result.user = instanceToPlain(new UserSerializer(result.user));
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.AUTH.LOGIN_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.LOGIN_SUCCESS.code,
      data: result,
    };
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: DGoogleCallback, @Res() res: Response) {
    const response = await this.authService.loginWithGoogle({
      email: req.user.email,
    });

    const token = encodeURIComponent(response.token);
    const email = encodeURIComponent(response.user.email ?? '');
    res.redirect(urlCallback.google({ token, email }));
  }

  @ApiResponse({
    status: 200,
    description: 'User successfully login',
    type: DLoginResSuccess,
  })
  @UsePipes(new ZodValidationPipe(callbackLoginSchema))
  @Post('callback/login')
  async callbackLogin(@Body() data: DLoginGoogle): Promise<DLoginResSuccess> {
    const result = await this.authService.loginWithGoogle({ email: data.email });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.AUTH.LOGIN_SUCCESS.message,
      code: HTTP_RESPONSE.AUTH.LOGIN_SUCCESS.code,
      data: result,
    };
  }

  @ApiResponse({
    status: 200,
    description: 'User successfully logout',
    type: DLogoutRes,
  })
  @Post('logout')
  async logout(@Body() data: DLogout): Promise<DLogoutRes> {
    const { token } = data;
    return await this.authService.logout({ token });
  }

  @ApiResponse({
    status: 200,
    description: 'User successfully change password',
    type: DChangePasswordRes,
  })
  @Roles(ValidRolesEnum.ADMIN, ValidRolesEnum.EDITOR, ValidRolesEnum.USER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(changePasswordSchema))
  @Put('update/:userId/password')
  updatePassword(
    @Body() data: DChangePassword,
    @Param() params: DParamsUser
  ): Promise<DChangePasswordRes> {
    const { userId: id } = params;
    return this.authService.changePassword({ data, id });
  }

  @ApiResponse({
    status: 201,
    description: 'Verify email successfully',
    type: DVerifyMailRes,
  })
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  @Get('verify')
  async verifyMail(@Query() data: DVerifyMail, @Res() res: Response) {
    await this.authService.verifyMail({ data });
    res.redirect(`${envs.feUrl}`);
  }

  @ApiResponse({
    status: 201,
    description: 'Req OTP successfully',
    type: DOtpEmailRes,
  })
  @Post('otp')
  reqOTPtoEmail(@Body() data: DOtpEmail) {
    return this.authService.sendOtpToEmail({ email: data.email });
  }

  @ApiResponse({
    status: 201,
    description: 'verify OTP successfully',
    type: DVerifyOtpRes,
  })
  @Post('otp/verify')
  verifyOTP(@Body() data: DVerifyOtp) {
    const { otp, email } = data;
    return this.authService.verifyOTP({ otp, email });
  }

  @ApiResponse({
    status: 201,
    description: 'User successfully change password',
    type: DChangePasswordRes,
  })
  @Post('update/:userId/forgot_password')
  updateForgotPassword(@Body() data: DChangeForgotPassword, @Param() params: DParamsUser) {
    const { userId: id } = params;
    return this.authService.changeForgotPassword({ data, id });
  }
}
