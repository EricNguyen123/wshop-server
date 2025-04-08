import { Column, Entity, OneToMany } from 'typeorm';
import { BaseModel } from './base-model';
import { ActiveStorageAttachmentsEntity } from './active-storage-attachments.entity';

@Entity('active_storage_blobs')
export class ActiveStorageBlobsEntity extends BaseModel {
  @Column({ name: 'key', type: 'varchar' })
  key: string;

  @Column({ name: 'filename', type: 'varchar' })
  filename: string;

  @Column({ name: 'content_type', type: 'varchar' })
  contentType: string;

  @Column({ name: 'metadata', type: 'text' })
  metadata: string;

  @Column({ name: 'byte_size', type: 'bigint' })
  byteSize: number;

  @Column({ name: 'checksum', type: 'varchar' })
  checksum: string;

  @OneToMany(
    () => ActiveStorageAttachmentsEntity,
    (activeStorageAttachment) => activeStorageAttachment.activeStorageBlob
  )
  activeStorageAttachments: ActiveStorageAttachmentsEntity[];
}
