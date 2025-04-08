import { Column, Entity, OneToMany } from 'typeorm';
import { BillLogsEntity } from './bill-logs.entity';
import { BillGroupsEntity } from './bill-groups.entity';
import { OrdersEntity } from './orders.entity';
import { BaseModel } from './base-model';

@Entity('bills')
export class BillsEntity extends BaseModel {
  @Column({ name: 'status', type: 'smallint' })
  status: number;

  @Column({ name: 'export_at', type: 'datetime' })
  exportAt: Date;

  @Column({ name: 'bill_id', type: 'varchar', length: 255 })
  billId: string;

  @Column({ name: 'reduced_taxable_amount', type: 'int' })
  reducedTaxableAmount: number;

  @Column({ name: 'reduced_tax', type: 'int' })
  reducedTax: number;

  @Column({ name: 'taxable_amount', type: 'int' })
  taxableAmount: number;

  @Column({ name: 'tax', type: 'int' })
  tax: number;

  @Column({ name: 'shipping_fee', type: 'int' })
  shippingFee: number;

  @Column({ name: 'amount', type: 'int' })
  amount: number;

  @Column({ name: 'discount', type: 'int' })
  discount: number;

  @Column({ name: 'total_amount', type: 'int' })
  totalAmount: number;

  @OneToMany(() => BillLogsEntity, (billLogs) => billLogs.bill, {
    cascade: true,
  })
  billLogs: BillLogsEntity[];

  @OneToMany(() => BillGroupsEntity, (billGroups) => billGroups.bill, {
    cascade: true,
  })
  billGroups: BillGroupsEntity[];

  @OneToMany(() => OrdersEntity, (orders) => orders.bill, {
    cascade: true,
  })
  orders: OrdersEntity[];
}
