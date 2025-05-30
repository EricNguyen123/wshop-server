import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/entities/user.entity';

export class UserSerializer extends UserEntity {
  @Exclude()
  declare createdAt: Date;

  @Exclude()
  declare createdBy: string;

  @Exclude()
  declare updatedAt: Date;

  @Exclude()
  declare updatedBy: string;

  @Exclude()
  declare deletedAt: Date;

  @Exclude()
  declare deletedBy: string;

  @Exclude()
  declare encryptedPassword: string;

  @Exclude()
  declare tokens: string;

  @Exclude()
  declare provider: string;

  @Exclude()
  declare uid: string;

  constructor(partial: Partial<UserEntity>) {
    super();
    Object.assign(this, partial);
  }
}
