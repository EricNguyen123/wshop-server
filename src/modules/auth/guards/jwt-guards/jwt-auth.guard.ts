import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from 'src/interfaces/auth.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private authService: AuthService
  ) {
    super();
  }

  getRequest(context: ExecutionContext): Request {
    return context.switchToHttp().getRequest<Request>();
  }

  handleRequest<TUser = IUser>(err: any, user: any, info: any, context: ExecutionContext) {
    const request = this.getRequest(context);

    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }

    const authHeader = request.headers['authorization'] as string | undefined;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }
    try {
      const payload: JwtPayload = this.jwtService.verify(token);

      // if (payload.exp && Date.now() >= payload.exp * 1000) {
      //   this.authService.logout(token);
      //   throw new UnauthorizedException('Token expired');
      // }

      return user as TUser;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid token';
      throw new UnauthorizedException(errorMessage);
    }
  }
}
