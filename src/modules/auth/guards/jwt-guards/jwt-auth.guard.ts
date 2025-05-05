import {
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from 'src/interfaces/auth.interface';
import { HTTP_RESPONSE } from 'src/constants/http-response';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private authService: AuthService
  ) {
    super();
  }

  private readonly logger = new Logger(JwtAuthGuard.name, { timestamp: true });

  getRequest(context: ExecutionContext): Request {
    return context.switchToHttp().getRequest<Request>();
  }

  handleRequest<TUser = IUser>(err: any, user: any, info: any, context: ExecutionContext) {
    const label = '[handleRequest]';
    const request = this.getRequest(context);

    this.logger.debug(`${label} user -> ${JSON.stringify(user)}`);
    if (err || !user) {
      this.logger.error(`${label} err -> ${JSON.stringify(err)}`);
      throw (
        err ||
        new UnauthorizedException({
          status: HttpStatus.UNAUTHORIZED,
          message: HTTP_RESPONSE.AUTH.INVALID_TOKEN.message,
          code: HTTP_RESPONSE.AUTH.INVALID_TOKEN.code,
        })
      );
    }

    const authHeader = request.headers['authorization'] as string | undefined;
    this.logger.debug(`${label} authHeader`);
    if (!authHeader) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.AUTH_HEADER_MISSING.message,
        code: HTTP_RESPONSE.AUTH.AUTH_HEADER_MISSING.code,
      });
    }

    const token = authHeader.split(' ')[1];
    this.logger.debug(`${label} token`);
    if (!token) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.TOKEN_IS_MISSING.message,
        code: HTTP_RESPONSE.AUTH.TOKEN_IS_MISSING.code,
      });
    }
    try {
      const payload: JwtPayload = this.jwtService.verify(token);

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        this.authService.logout({ token }).catch((error) => {
          this.logger.error(`${label} logout -> ${JSON.stringify(error)}`);
        });
        this.logger.error(`${label} token expired`);
        throw new UnauthorizedException({
          status: HttpStatus.UNAUTHORIZED,
          message: HTTP_RESPONSE.AUTH.TOKEN_EXPIRED.message,
          code: HTTP_RESPONSE.AUTH.TOKEN_EXPIRED.code,
        });
      }

      return user as TUser;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.AUTH.INVALID_TOKEN.message;
      this.logger.error(`${label} errorMessage -> ${errorMessage}`);
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: errorMessage,
        code: HTTP_RESPONSE.AUTH.INVALID_TOKEN.code,
      });
    }
  }
}
