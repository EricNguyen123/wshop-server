import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PrefecturesEntity } from './prefectures.entity';
import { StoreEntity } from './stores.entity';
import { BaseModel } from './base-model';

@Entity('store_prefectures')
export class StorePrefecturesEntity extends BaseModel {
  @Column({ type: 'int' })
  shipping_fee: number;

  @ManyToOne(() => PrefecturesEntity, (prefecture) => prefecture.storePrefectures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prefecture_id' })
  prefecture: PrefecturesEntity;

  @ManyToOne(() => StoreEntity, (store) => store.storePrefectures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: StoreEntity;
}
