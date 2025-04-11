import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ProductsEntity } from './products.entity';
import { ColorTypesEntity } from './color-types.entity';
import { SizeTypesEntity } from './size-types.entity';
import { ProductTypeResourcesEntity } from './product-type-resources.entity';
import { CartItemsEntity } from './cart-items.entity';
import { BillItemsEntity } from './bill-items.entity';
import { BaseModel } from './base-model';

@Entity('product_types')
export class ProductTypesEntity extends BaseModel {
  @Column({ name: 'quantity', type: 'int', unsigned: true })
  quantity: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'color_type_id', type: 'uuid' })
  colorTypeId: string;

  @Column({ name: 'size_type_id', type: 'uuid' })
  sizeTypeId: string;

  @ManyToOne(() => ProductsEntity, (product) => product.productTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;

  @ManyToOne(() => ColorTypesEntity, (colorType) => colorType.productTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'color_type_id' })
  colorType: ColorTypesEntity;

  @ManyToOne(() => SizeTypesEntity, (sizeType) => sizeType.productTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'size_type_id' })
  sizeType: SizeTypesEntity;

  @OneToMany(() => CartItemsEntity, (cartItems) => cartItems.productType, {
    cascade: true,
  })
  cartItems: CartItemsEntity[];

  @OneToMany(
    () => ProductTypeResourcesEntity,
    (productTypeResources) => productTypeResources.productType,
    {
      cascade: true,
    }
  )
  productTypeResources: ProductTypeResourcesEntity[];

  @OneToMany(() => BillItemsEntity, (billItems) => billItems.productType, {
    cascade: true,
  })
  billItems: BillItemsEntity[];
}
