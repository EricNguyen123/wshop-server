import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ShippingSettingsEntity } from './shipping-settings.entity';
import { StorePrefecturesEntity } from './store-prefectures.entity';
import { BaseModel } from './base-model';

@Entity('prefectures')
export class PrefecturesEntity extends BaseModel {
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'postcode', type: 'varchar' })
  postcode: string;

  @Column({ name: 'shipping_fee', type: 'int' })
  shippingFee: number;

  @Column({ name: 'kind', type: 'int' })
  kind: number;

  @Column({ name: 'label', type: 'varchar', length: 255 })
  label: string;

  @Column({ name: 'shipping_setting_id', type: 'uuid' })
  shippingSettingId: string;

  @ManyToOne(() => ShippingSettingsEntity, (shippingSetting) => shippingSetting.prefectures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipping_setting_id' })
  shippingSetting: ShippingSettingsEntity;

  @OneToMany(() => StorePrefecturesEntity, (storePrefectures) => storePrefectures.prefecture, {
    cascade: true,
  })
  storePrefectures: StorePrefecturesEntity[];
}
