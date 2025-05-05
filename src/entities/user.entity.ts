import { IsEmail } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseModel } from './base-model';
import { StatusEnum, ValidRolesEnum } from 'src/common/enums/base.enum';
import { CartItemsEntity } from './cart-items.entity';
import { FavoritesEntity } from './favorites.entity';
import { OrdersEntity } from './orders.entity';
import { ShippingMakerManagersEntity } from './shipping-maker-managers.entity';

@Entity('users')
export class UserEntity extends BaseModel {
  @Column({ name: 'email', unique: true, type: 'varchar', length: 255 })
  @IsEmail()
  email: string;

  @Column({
    name: 'role',
    type: 'varchar',
    length: 8,
    default: ValidRolesEnum.USER,
  })
  role: ValidRolesEnum;

  @Column({ name: 'name', type: 'varchar', default: null, nullable: true, length: 255 })
  name: string;

  @Column({ name: 'zipcode', type: 'varchar', default: null, nullable: true, length: 8 })
  zipcode: string;

  @Column({ name: 'phone', type: 'varchar', default: null, nullable: true, length: 12 })
  phone: string;

  @Column({ name: 'prefecture', type: 'varchar', default: null, nullable: true })
  prefecture: string;

  @Column({ name: 'city', type: 'varchar', default: null, nullable: true })
  city: string;

  @Column({ name: 'street', type: 'varchar', default: null, nullable: true })
  street: string;

  @Column({ name: 'building', type: 'varchar', default: null, nullable: true })
  building: string;

  @Column({ name: 'encrypted_password', type: 'varchar' })
  encryptedPassword: string;

  @Column({ name: 'status', type: 'smallint', default: StatusEnum.NOT_ACTIVE })
  status: StatusEnum;

  @Column({ name: 'current_sign_in_at', type: 'datetime', default: null, nullable: true })
  currentSignInAt: Date;

  @Column({ name: 'last_sign_in_at', type: 'datetime', default: null, nullable: true })
  lastSignInAt: Date;

  @Column({ name: 'tokens', type: 'text', default: null, nullable: true })
  tokens: string;

  @Column({ name: 'provider', type: 'varchar', default: null, nullable: true })
  provider: string;

  @Column({ name: 'uid', type: 'varchar', default: null, nullable: true })
  uid: string;

  @OneToMany(() => CartItemsEntity, (cartItems) => cartItems.user, {
    cascade: true,
  })
  cartItems: CartItemsEntity[];

  @OneToMany(() => OrdersEntity, (orders) => orders.user)
  orders: OrdersEntity[];

  @OneToMany(() => OrdersEntity, (ordersOrderer) => ordersOrderer.orderer, {
    cascade: true,
  })
  ordersOrderer: OrdersEntity[];

  @OneToMany(() => OrdersEntity, (ordersReceiver) => ordersReceiver.receiver)
  ordersReceiver: OrdersEntity[];

  @OneToMany(
    () => ShippingMakerManagersEntity,
    (shippingMakerManagers) => shippingMakerManagers.user,
    {
      cascade: true,
    }
  )
  shippingMakerManagers: ShippingMakerManagersEntity[];

  @OneToMany(() => FavoritesEntity, (favorites) => favorites.user, {
    cascade: true,
  })
  favorites: FavoritesEntity[];
}
