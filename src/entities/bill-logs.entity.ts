import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BillsEntity } from './bills.entity';
import { BaseModel } from './base-model';

@Entity('bill_logs')
export class BillLogsEntity extends BaseModel {
  @Column({ name: 'content', type: 'text' })
  content: string;

  @ManyToOne(() => BillsEntity, (bill) => bill.billLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: BillsEntity;
}
