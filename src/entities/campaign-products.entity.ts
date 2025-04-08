import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CampaignsEntity } from './campaigns.entity';
import { ProductsEntity } from './products.entity';
import { BaseModel } from './base-model';

@Entity('campaign_products')
export class CampaignProductsEntity extends BaseModel {
  @Column({ name: 'discount_value', type: 'int' })
  discountValue: number;

  @Column({ name: 'product_type', type: 'int' })
  productType: number;

  @ManyToOne(() => CampaignsEntity, (campaign) => campaign.campaignProducts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: CampaignsEntity;

  @ManyToOne(() => ProductsEntity, (product) => product.campaignProducts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;
}
