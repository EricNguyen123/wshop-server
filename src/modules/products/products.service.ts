import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { MediaService } from '../media/media.service';
import { FileService } from '../file/file.service';
import { ProductsEntity } from 'src/entities/products.entity';
import { ICreateProduct, IUpdateProduct } from 'src/interfaces/product.interface';
import {
  MediaTypeEnum,
  RecordTypeFileEnum,
  ResourceMediaTypeEnum,
} from 'src/common/enums/common.enum';
import { DefaultMediaUrl } from 'src/constants/common';
import { instanceToPlain } from 'class-transformer';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { isErrorWithResponseCode } from 'src/utils/common.util';
import { ProductSerializer } from 'src/serializer/product/product.serializer';
import * as fs from 'fs';
import { DQueryGetListProduct } from 'src/dto/product/query-get-list-product.dto';
import { MediaItemsEntity } from 'src/entities/media-items.entity';
import { addAdvancedSearch, createSubquery } from 'src/common/helpers/query.helper';
import { paginate } from 'src/common/helpers/paginate.helper';
import { ActiveStorageAttachmentsEntity } from 'src/entities/active-storage-attachments.entity';
import { ActiveStorageBlobsEntity } from 'src/entities/active-storage-blobs.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductsEntity)
    private readonly productRepository: Repository<ProductsEntity>,
    private readonly fileService: FileService,
    private readonly mediaService: MediaService,
    private dataSource: DataSource
  ) {}
  private readonly logger = new Logger(ProductsService.name, { timestamp: true });

  async createProduct(payload: { files: Express.Multer.File[]; product: ICreateProduct }) {
    const label = '[createProduct]';
    const { files, product } = payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productEntity = queryRunner.manager.create(ProductsEntity, {
        ...product,
      });
      const existedProduct = await queryRunner.manager.save(productEntity);
      this.logger.debug(`${label} existedProduct -> ${JSON.stringify(existedProduct)}`);

      const medias = await Promise.all(
        files.map(async (file) => {
          const media = await this.mediaService.createMedia(
            {
              resourceId: existedProduct.id,
              resourceType: ResourceMediaTypeEnum.PRODUCT,
              mediaType: MediaTypeEnum.PRODUCT_IMAGE,
              mediaUrl: DefaultMediaUrl.PRODUCT,
            },
            queryRunner.manager
          );
          this.logger.debug(`${label} media -> ${JSON.stringify(media)}`);

          return { ...media, fileName: file.originalname, fileSize: file.size };
        })
      );

      await this.fileService.uploadMultipleFiles(
        {
          files,
          uploadFileDtos: medias.map((media) => ({
            recordType: RecordTypeFileEnum.MEDIA,
            recordId: media.id,
          })),
        },
        queryRunner.manager
      );

      const existedMedias = await Promise.all(
        medias.map(async (media) => {
          const existedMedia = await this.mediaService.checkExistedMedia(
            { id: media.id },
            queryRunner.manager
          );
          this.logger.debug(`${label} existedMedia -> ${JSON.stringify(existedMedia)}`);

          return {
            id: existedMedia.id,
            mediaUrl: existedMedia.mediaUrl,
            fileName: media.fileName,
            fileSize: media.fileSize,
          };
        })
      );

      await queryRunner.commitTransaction();

      return {
        product: instanceToPlain(new ProductSerializer(existedProduct)),
        medias: existedMedias,
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      for (const file of files) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.FILE.UPLOAD_ERROR.message;
      const defaultCode = HTTP_RESPONSE.FILE.UPLOAD_ERROR.code;
      let errorCode = defaultCode;

      if (isErrorWithResponseCode(error)) {
        errorCode = error.response.code;
      }

      this.logger.error(`${label} error: ${errorMessage}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async getProducts(payload: { query: DQueryGetListProduct }) {
    const label = '[getProducts]';
    const { textSearch, page, limit, sort, ...fields } = payload.query;

    const pagination: {
      page?: number;
      limit?: number;
      sort?: string;
    } = { page, limit, sort };

    const mediaSubquery = createSubquery(MediaItemsEntity, 'm')
      .select(['id', { field: 'm.mediaUrl', alias: 'mediaUrl' }])
      .addRawSelect('a.name', 'fileName')
      .addRawSelect('b.byte_size', 'fileSize')
      .leftJoin(
        ActiveStorageAttachmentsEntity,
        'a',
        'a.recordId = m.id AND a.recordType = :recordType',
        { recordType: RecordTypeFileEnum.MEDIA }
      ) // a = active_storage_attachments
      .leftJoin(ActiveStorageBlobsEntity, 'b', 'b.id = a.blobId') // b = active_storage_blobs
      .relatedTo('p', 'resourceId')
      .where('m.resourceType = :resourceType', { resourceType: ResourceMediaTypeEnum.PRODUCT })
      .where('m.mediaType = :mediaType', { mediaType: MediaTypeEnum.PRODUCT_IMAGE })
      .as('medias');

    const queryBuilder = this.productRepository
      .createQueryBuilder('p') // p = products
      .select([
        'p.id as id',
        'p.name as name',
        'p.code as code',
        'p.price as price',
        'p.quantity as quantity',
        'p.quantityAlert as quantityAlert',
        'p.orderUnit as orderUnit',
        'p.description as description',
        'p.status as status',
        'p.multiplicationRate as multiplicationRate',
        'p.discount as discount',
      ])
      .addSelect(mediaSubquery.build<ProductsEntity>(), 'medias');

    if (textSearch) {
      addAdvancedSearch(queryBuilder, textSearch, [{ field: 'name' }, { field: 'code' }]);
    }

    const conditions: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null && value !== '') {
        conditions[key] = value as string | number | boolean;
      }
    }

    if (Object.keys(conditions).length > 0) {
      queryBuilder.andWhere(conditions);
    }

    const result = await paginate(queryBuilder, pagination);
    this.logger.debug(`${label} result: ${JSON.stringify(result)}`);

    return {
      ...result,
      data: result.data.map((p: Partial<ProductsEntity>) => {
        const productData = instanceToPlain(new ProductSerializer(p));
        return productData;
      }),
    };
  }

  async updateProduct(payload: {
    files: Express.Multer.File[];
    data: IUpdateProduct;
    productId: string;
  }) {
    const label = '[updateProduct]';
    const { files, data, productId } = payload;

    this.logger.debug(`${label} data -> ${JSON.stringify(data)}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { mediaIds: rawMediaIds, ...product } = data;

      const mediaIds = Array.isArray(rawMediaIds) ? rawMediaIds : rawMediaIds ? [rawMediaIds] : [];
      this.logger.debug(`${label} mediaIds -> ${JSON.stringify(mediaIds)}`);

      const existedProduct = await this.productRepository.findOneBy({ id: productId });
      this.logger.debug(`${label} existedProduct -> ${JSON.stringify(existedProduct)}`);

      if (!existedProduct) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.PRODUCT.NOT_FOUND.message,
          code: HTTP_RESPONSE.PRODUCT.NOT_FOUND.code,
        });
      }

      await queryRunner.manager.update(
        ProductsEntity,
        { id: productId },
        {
          ...product,
        }
      );

      const updatedProduct = await queryRunner.manager.findOne(ProductsEntity, {
        where: { id: productId },
      });
      this.logger.debug(`${label} updatedProduct -> ${JSON.stringify(updatedProduct)}`);

      const existedOldMedias = await this.mediaService.checkExistedMediaByResource({
        resourceId: productId,
        resourceType: ResourceMediaTypeEnum.PRODUCT,
        mediaType: MediaTypeEnum.PRODUCT_IMAGE,
      });

      if (mediaIds && mediaIds.length >= 0) {
        const deleteMediaIds = existedOldMedias
          .filter((media) => !mediaIds.includes(media.id))
          .map((media) => media.id);

        if (deleteMediaIds.length) {
          const existedFiles = await Promise.all(
            deleteMediaIds.map(async (mediaId) => {
              const file = await this.fileService.getFilesByRecord({
                recordType: RecordTypeFileEnum.MEDIA,
                recordId: mediaId,
              });

              return file;
            })
          );

          await Promise.all(
            existedFiles.map(async (files) => {
              await Promise.all(
                files.map(async (file) => {
                  await this.fileService.deleteFile({ id: file.id }, queryRunner.manager);
                })
              );
            })
          );

          await queryRunner.manager.softDelete(MediaItemsEntity, {
            id: In(deleteMediaIds),
          });
        }
      }

      let existedMedias: { id: string; mediaUrl: string; fileName: string; fileSize: number }[] =
        [];
      if (files.length > 0) {
        const medias = await Promise.all(
          files.map(async (file) => {
            const media = await this.mediaService.createMedia(
              {
                resourceId: productId,
                resourceType: ResourceMediaTypeEnum.PRODUCT,
                mediaType: MediaTypeEnum.PRODUCT_IMAGE,
                mediaUrl: DefaultMediaUrl.PRODUCT,
              },
              queryRunner.manager
            );
            this.logger.debug(`${label} media -> ${JSON.stringify(media)}`);

            return { ...media, fileName: file.originalname, fileSize: file.size };
          })
        );

        await this.fileService.uploadMultipleFiles(
          {
            files,
            uploadFileDtos: medias.map((media) => ({
              recordType: RecordTypeFileEnum.MEDIA,
              recordId: media.id,
            })),
          },
          queryRunner.manager
        );

        existedMedias = await Promise.all(
          medias.map(async (media) => {
            const existedMedia = await this.mediaService.checkExistedMedia(
              { id: media.id },
              queryRunner.manager
            );
            this.logger.debug(`${label} existedMedia -> ${JSON.stringify(existedMedia)}`);

            return {
              id: existedMedia.id,
              mediaUrl: existedMedia.mediaUrl,
              fileName: media.fileName,
              fileSize: media.fileSize,
            };
          })
        );
        this.logger.debug(`${label} existedMedias -> ${JSON.stringify(existedMedias)}`);
      }

      const oldMedias = Array.isArray(mediaIds)
        ? await Promise.all(
            mediaIds.map(async (mediaId) => await this.mediaService.getMediaById({ id: mediaId }))
          )
        : [];
      this.logger.debug(`${label} oldMedias -> ${JSON.stringify(oldMedias)}`);

      await queryRunner.commitTransaction();

      return {
        ...instanceToPlain(new ProductSerializer({ id: existedProduct.id, ...product })),
        medias: [...existedMedias, ...oldMedias],
      };
    } catch (error: unknown) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      for (const file of files) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.FILE.UPLOAD_ERROR.message;
      const defaultCode = HTTP_RESPONSE.FILE.UPLOAD_ERROR.code;
      let errorCode = defaultCode;

      if (isErrorWithResponseCode(error)) {
        errorCode = error.response.code;
      }

      this.logger.error(`${label} error: ${errorMessage}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProduct(payload: { productId: string }) {
    const { productId } = payload;
    const label = '[deleteProduct]';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existedProduct = await this.productRepository.findOneBy({ id: productId });
      this.logger.debug(`${label} existedProduct -> ${JSON.stringify(existedProduct)}`);

      if (!existedProduct) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.PRODUCT.NOT_FOUND.message,
          code: HTTP_RESPONSE.PRODUCT.NOT_FOUND.code,
        });
      }

      await queryRunner.manager.softDelete(ProductsEntity, { id: productId });

      const existedMedias = await this.mediaService.getMediaByResource({
        resourceId: productId,
        resourceType: ResourceMediaTypeEnum.PRODUCT,
        mediaType: MediaTypeEnum.PRODUCT_IMAGE,
      });

      if (existedMedias.length) {
        const existedFiles = await Promise.all(
          existedMedias.map(async (media) => {
            const file = await this.fileService.getFilesByRecord({
              recordType: RecordTypeFileEnum.MEDIA,
              recordId: media.id,
            });

            return file;
          })
        );

        await Promise.all(
          existedFiles.map(async (files) => {
            await Promise.all(
              files.map(async (file) => {
                await this.fileService.deleteFile({ id: file.id }, queryRunner.manager);
              })
            );
          })
        );

        await queryRunner.manager.softDelete(MediaItemsEntity, {
          resourceId: productId,
          resourceType: ResourceMediaTypeEnum.PRODUCT,
          mediaType: MediaTypeEnum.PRODUCT_IMAGE,
        });
      }

      await queryRunner.commitTransaction();
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.FILE.UPLOAD_ERROR.message;
      this.logger.error(`${label} error: ${errorMessage}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        code: HTTP_RESPONSE.FILE.UPLOAD_ERROR.code,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async getDetailProduct(payload: { productId: string }) {
    const { productId } = payload;
    const label = '[getDetailsProduct]';

    const mediaSubquery = createSubquery(MediaItemsEntity, 'm')
      .select(['id', { field: 'm.mediaUrl', alias: 'mediaUrl' }])
      .addRawSelect('a.name', 'fileName')
      .addRawSelect('b.byte_size', 'fileSize')
      .leftJoin(
        ActiveStorageAttachmentsEntity,
        'a',
        'a.recordId = m.id AND a.recordType = :recordType',
        { recordType: RecordTypeFileEnum.MEDIA }
      ) // a = active_storage_attachments
      .leftJoin(ActiveStorageBlobsEntity, 'b', 'b.id = a.blobId') // b = active_storage_blobs
      .relatedTo('p', 'resourceId')
      .where('m.resourceType = :resourceType', { resourceType: ResourceMediaTypeEnum.PRODUCT })
      .where('m.mediaType = :mediaType', { mediaType: MediaTypeEnum.PRODUCT_IMAGE })
      .as('medias');

    const queryBuilder = this.productRepository
      .createQueryBuilder('p') // p = products
      .select([
        'p.id as id',
        'p.name as name',
        'p.code as code',
        'p.price as price',
        'p.quantity as quantity',
        'p.quantityAlert as quantityAlert',
        'p.orderUnit as orderUnit',
        'p.description as description',
        'p.status as status',
        'p.multiplicationRate as multiplicationRate',
        'p.discount as discount',
      ])
      .addSelect(mediaSubquery.build<ProductsEntity>(), 'medias')
      .where('p.id = :productId', { productId });

    const result: Partial<ProductsEntity> | undefined = await queryBuilder.getRawOne();
    this.logger.debug(`${label} result: ${JSON.stringify(result)}`);

    if (!result) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.PRODUCT.NOT_FOUND.message,
        code: HTTP_RESPONSE.PRODUCT.NOT_FOUND.code,
      });
    }

    return instanceToPlain(new ProductSerializer(result));
  }
}
