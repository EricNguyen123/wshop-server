import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { HTTP_RESPONSE } from 'src/constants/http-response';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }
  private readonly logger = new Logger(LocalStrategy.name, { timestamp: true });

  async validate(email: string, password: string) {
    const label = '[validate]';
    if (password === '')
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: HTTP_RESPONSE.AUTH.REQUIRE_PASSWORD.message,
        code: HTTP_RESPONSE.AUTH.REQUIRE_PASSWORD.code,
      });
    const data = { email, password };
    const user = await this.authService.validateCheckUser({ data });
    this.logger.debug(`${label} user -> ${JSON.stringify(user)}`);

    return user;
  }
}
