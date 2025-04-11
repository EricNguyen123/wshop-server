import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CategoryTinyEntity } from './category-tinies.entity';
import { BaseModel } from './base-model';

@Entity('categories')
export class CategoriesEntity extends BaseModel {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'parent_category_id', type: 'uuid', nullable: true })
  parentCategoryId: string;

  @ManyToOne(() => CategoriesEntity, (category) => category.subCategories, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory: CategoriesEntity;

  @OneToMany(() => CategoriesEntity, (category) => category.parentCategory, {
    cascade: true,
  })
  subCategories: CategoriesEntity[];

  @OneToMany(() => CategoryTinyEntity, (categoryTinies) => categoryTinies.category, {
    cascade: true,
  })
  categoryTinies: CategoryTinyEntity[];
}
