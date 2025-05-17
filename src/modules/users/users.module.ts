import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-guards/jwt-auth.guard';
import { UserEntity } from 'src/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => FileModule),
    forwardRef(() => MediaModule),
  ],
  controllers: [UsersController],
  providers: [JwtAuthGuard, UsersService],
  exports: [TypeOrmModule.forFeature([UserEntity]), UsersService],
})
export class UsersModule {}
