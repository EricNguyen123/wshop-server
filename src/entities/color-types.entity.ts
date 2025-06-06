import { Column, Entity, OneToMany } from 'typeorm';
import { ProductTypesEntity } from './product-types.entity';
import { BaseModel } from './base-model';

@Entity('color_types')
export class ColorTypesEntity extends BaseModel {
  @Column({ name: 'color_code', type: 'varchar', length: 255 })
  colorCode: string;

  @Column({ name: 'name', type: 'text' })
  name: string;

  @OneToMany(() => ProductTypesEntity, (productTypes) => productTypes.colorType, {
    cascade: true,
  })
  productTypes: ProductTypesEntity[];
}
