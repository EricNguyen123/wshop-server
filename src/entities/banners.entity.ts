import { IsUrl } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { BaseModel } from './base-model';

@Entity('banners')
export class BannersEntity extends BaseModel {
  @Column({ name: 'descriptions', type: 'text' })
  descriptions: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'number_order', type: 'int' })
  numberOrder: number;

  @Column({ name: 'url', type: 'varchar' })
  @IsUrl()
  url: string;
}
