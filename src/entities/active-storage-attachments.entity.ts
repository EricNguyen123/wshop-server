import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ActiveStorageBlobsEntity } from './active-storage-blobs.entity';
import { MediaItemsEntity } from './media-items.entity';
import { BaseModel } from './base-model';

@Entity('active_storage_attachments')
export class ActiveStorageAttachmentsEntity extends BaseModel {
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'record_type', type: 'varchar' })
  recordType: string;

  @Column({ name: 'blob_id', type: 'uuid' })
  blobId: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @ManyToOne(
    () => ActiveStorageBlobsEntity,
    (activeStorageBlob) => activeStorageBlob.activeStorageAttachments
  )
  @JoinColumn({ name: 'blob_id' })
  activeStorageBlob: ActiveStorageBlobsEntity;

  @ManyToOne(() => MediaItemsEntity, (mediaItem) => mediaItem.activeStorageAttachments)
  @JoinColumn({ name: 'record_id' })
  mediaItem: MediaItemsEntity;
}
