import { IsEmail } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { ProductResourceEntity } from './product-resources.entity';
import { StorePrefecturesEntity } from './store-prefectures.entity';
import { CartItemsEntity } from './cart-items.entity';
import { BillGroupsEntity } from './bill-groups.entity';
import { BaseModel } from './base-model';
import { StatusEnum } from 'src/common/enums/base.enum';

@Entity('stores')
export class StoreEntity extends BaseModel {
  @Column({ name: 'email', type: 'varchar', length: 255 })
  @IsEmail()
  email: string;

  @Column({ name: 'name', type: 'varchar', default: null, nullable: true, length: 255 })
  name: string;

  @Column({ name: 'postcode', type: 'varchar', length: 8 })
  postcode: string;

  @Column({ name: 'prefecture', type: 'varchar', default: null, nullable: true })
  prefecture: string;

  @Column({ name: 'city', type: 'varchar', default: null, nullable: true })
  city: string;

  @Column({ name: 'street', type: 'varchar', default: null, nullable: true })
  street: string;

  @Column({ name: 'building', type: 'varchar', default: null, nullable: true })
  building: string;

  @Column({ name: 'status', type: 'varchar', default: StatusEnum.NOT_ACTIVE })
  status: StatusEnum;

  @OneToMany(() => ProductResourceEntity, (productResources) => productResources.product, {
    cascade: true,
  })
  productResources: ProductResourceEntity[];

  @OneToMany(() => StorePrefecturesEntity, (storePrefectures) => storePrefectures.store, {
    cascade: true,
  })
  storePrefectures: StorePrefecturesEntity[];

  @OneToMany(() => CartItemsEntity, (cartItems) => cartItems.store, {
    cascade: true,
  })
  cartItems: CartItemsEntity[];

  @OneToMany(() => BillGroupsEntity, (billGroups) => billGroups.store, {
    cascade: true,
  })
  billGroups: BillGroupsEntity[];
}
