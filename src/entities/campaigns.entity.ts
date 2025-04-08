import { Column, Entity, OneToMany } from 'typeorm';
import { CampaignProductsEntity } from './campaign-products.entity';
import { CartItemsEntity } from './cart-items.entity';
import { BaseModel } from './base-model';

@Entity('campaigns')
export class CampaignsEntity extends BaseModel {
  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'campaign_type', type: 'int' })
  campaignType: number;

  @Column({ name: 'bought_count', type: 'int' })
  boughtCount: number;

  @Column({ name: 'promotion_count', type: 'int' })
  promotionCount: number;

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @OneToMany(() => CampaignProductsEntity, (campaignProducts) => campaignProducts.campaign, {
    cascade: true,
  })
  campaignProducts: CampaignProductsEntity[];

  @OneToMany(() => CartItemsEntity, (cartItems) => cartItems.campaign, {
    cascade: true,
  })
  cartItems: CartItemsEntity[];
}
