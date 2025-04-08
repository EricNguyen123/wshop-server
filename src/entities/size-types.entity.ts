import { Column, Entity, OneToMany } from 'typeorm';
import { ProductTypesEntity } from './product-types.entity';
import { BaseModel } from './base-model';
import { SizeTypesEnum } from 'src/common/enums/common.enum';

@Entity('size_types')
export class SizeTypesEntity extends BaseModel {
  @Column({ name: 'size_code', type: 'varchar', length: 255 })
  size_code: string;

  @Column({
    name: 'size_type',
    type: 'varchar',
    default: SizeTypesEnum.MALE,
  })
  size_type: SizeTypesEnum;

  @OneToMany(() => ProductTypesEntity, (productTypes) => productTypes.sizeType, {
    cascade: true,
  })
  productTypes: ProductTypesEntity[];
}
