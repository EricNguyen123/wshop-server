import { Column, Entity, OneToMany } from 'typeorm';
import { PrefecturesEntity } from './prefectures.entity';
import { BaseModel } from './base-model';

@Entity('shipping_settings')
export class ShippingSettingsEntity extends BaseModel {
  @Column({ name: 'free_ship_amount', type: 'int' })
  freeShipAmount: number;

  @Column({ name: 'free_ship_number', type: 'int' })
  freeShipNumber: number;

  @OneToMany(() => PrefecturesEntity, (prefectures) => prefectures.shippingSetting, {
    cascade: true,
  })
  prefectures: PrefecturesEntity[];
}
