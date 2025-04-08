import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('active_storage_attachments')
export class BaseModel extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    name: 'created_at',
    precision: 6,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdDate: Date;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string;

  @UpdateDateColumn({
    name: 'updated_at',
    precision: 6,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedDate: Date;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true })
  updatedBy: string;

  @DeleteDateColumn({ name: 'deleted_at', precision: 6, type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ name: 'deleted_by', type: 'varchar', nullable: true })
  deletedBy: string;
}
