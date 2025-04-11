import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ProductTypesEntity } from './product-types.entity';
import { ProductResourceEntity } from './product-resources.entity';
import { BaseModel } from './base-model';

@Entity('product_type_resources')
export class ProductTypeResourcesEntity extends BaseModel {
  @Column({ name: 'quantity', type: 'int', unsigned: true })
  quantity: number;

  @Column({ name: 'product_type_id', type: 'uuid' })
  productTypeId: string;

  @Column({ name: 'product_resource_id', type: 'uuid' })
  productResourceId: string;

  @ManyToOne(() => ProductTypesEntity, (productType) => productType.productTypeResources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductTypesEntity;

  @ManyToOne(
    () => ProductResourceEntity,
    (productResource) => productResource.productTypeResources,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'product_resource_id' })
  productResource: ProductResourceEntity;
}
