import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';
import { ShippingInstructionsEntity } from './shipping-instructions.entity';
import { BaseModel } from './base-model';

@Entity('shipping_maker_managers')
export class ShippingMakerManagersEntity extends BaseModel {
  @ManyToOne(() => UserEntity, (user) => user.shippingMakerManagers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(
    () => ShippingInstructionsEntity,
    (shippingInstruction) => shippingInstruction.shippingMakerManagers,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'shipping_instruction_id' })
  shippingInstruction: ShippingInstructionsEntity;
}
