import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ProductsEntity } from './products.entity';
import { StoreEntity } from './stores.entity';
import { ProductTypeResourcesEntity } from './product-type-resources.entity';
import { BaseModel } from './base-model';

@Entity('product_resources')
export class ProductResourceEntity extends BaseModel {
  @ManyToOne(() => ProductsEntity, (product) => product.productResources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;

  @ManyToOne(() => StoreEntity, (store) => store.productResources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resource_id' })
  store: StoreEntity;

  @Column()
  resource_type: string;

  @Column({ name: 'quantity', type: 'int', unsigned: true })
  quantity: number;

  @OneToMany(
    () => ProductTypeResourcesEntity,
    (productTypeResources) => productTypeResources.productResource,
    {
      cascade: true,
    }
  )
  productTypeResources: ProductTypeResourcesEntity[];
}
