import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserEntity } from 'src/entities/user.entity';
import { AuthService } from '../auth.service';
import { envs } from 'src/config/envs';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly authService: AuthService) {
    super({
      secretOrKey: envs.jwtSecret,
      jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
    });
  }
  private readonly logger = new Logger(RefreshJwtStrategy.name, { timestamp: true });

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const label = '[validate]';
    const { id } = payload;

    const user = await this.authService.validateUser({ id: id as string });
    this.logger.log(`${label} user -> ${JSON.stringify(user)}`);
    return user;
  }
}
