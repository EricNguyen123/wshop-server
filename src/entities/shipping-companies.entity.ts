import { IsEmail, IsUrl } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { ShippingNoticesEntity } from './shipping-notices.entity';
import { BaseModel } from './base-model';

@Entity('shipping_companies')
export class ShippingCompaniesEntity extends BaseModel {
  @Column({ name: 'email', type: 'varchar', length: 255 })
  @IsEmail()
  email: string;

  @Column({ name: 'name', type: 'varchar', default: null, nullable: true, length: 255 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', default: null, nullable: true, length: 12 })
  phone: string;

  @Column({ name: 'url', type: 'varchar' })
  @IsUrl()
  url: string;

  @Column({ name: 'memo', type: 'text', default: null, nullable: true })
  memo: string;

  @OneToMany(() => ShippingNoticesEntity, (shippingNotices) => shippingNotices.shippingCompany, {
    cascade: true,
  })
  shippingNotices: ShippingNoticesEntity[];
}
