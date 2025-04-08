import { Column, Entity, OneToMany } from 'typeorm';
import { ActiveStorageAttachmentsEntity } from './active-storage-attachments.entity';
import { BaseModel } from './base-model';
import { IsUrl } from 'class-validator';

@Entity('media_items')
export class MediaItemsEntity extends BaseModel {
  @Column({ name: 'resource_type', type: 'varchar', length: 255 })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'int' })
  resourceId: number;

  @Column({ name: 'media_type', type: 'int' })
  mediaType: number;

  @Column({ name: 'media_url', type: 'varchar', length: 255 })
  @IsUrl()
  mediaUrl: string;

  @OneToMany(
    () => ActiveStorageAttachmentsEntity,
    (activeStorageAttachment) => activeStorageAttachment.mediaItem
  )
  activeStorageAttachments: ActiveStorageAttachmentsEntity[];
}
