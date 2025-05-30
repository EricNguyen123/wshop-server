import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import {
  MediaTypeEnum,
  RecordTypeFileEnum,
  ResourceMediaTypeEnum,
} from 'src/common/enums/common.enum';
import { TreeBuilderFacade } from 'src/common/helpers/facade/tree-builder.facade';
import { validateAndAssignEntities } from 'src/common/helpers/query.helper';
import { serializeTreeAdvanced } from 'src/common/helpers/serializer.helper';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DQueryGetListCategory } from 'src/dto/category/query-get-list-category.dto';
import { ActiveStorageAttachmentsEntity } from 'src/entities/active-storage-attachments.entity';
import { ActiveStorageBlobsEntity } from 'src/entities/active-storage-blobs.entity';
import { CategoriesEntity } from 'src/entities/categories.entity';
import { CategoryTinyEntity } from 'src/entities/category-tinies.entity';
import { MediaItemsEntity } from 'src/entities/media-items.entity';
import { ProductsEntity } from 'src/entities/products.entity';
import { ICreateCategory, IUpdateCategory } from 'src/interfaces/category.interface';
import { CategorySerializer } from 'src/serializer/category/category.serializer';
import { TreeBuilderOptions } from 'src/types/tree.types';
import { isErrorWithResponseCode } from 'src/utils/common.util';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoriesEntity)
    private readonly categoriesRepository: Repository<CategoriesEntity>,
    @InjectRepository(CategoryTinyEntity)
    private readonly categoryTinyRepository: Repository<CategoryTinyEntity>,
    @InjectRepository(ProductsEntity)
    private readonly productRepository: Repository<ProductsEntity>,
    private dataSource: DataSource
  ) {}
  private readonly logger = new Logger(CategoriesService.name, { timestamp: true });

  async createCategory(payload: { category: ICreateCategory }) {
    const label = '[createCategory]';
    const { category } = payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const categoryEntity = queryRunner.manager.create(CategoriesEntity, {
        ...category,
      });
      const existedCategory = await queryRunner.manager.save(categoryEntity);
      this.logger.debug(`${label} existedCategory -> ${JSON.stringify(existedCategory)}`);

      if (category.parentCategoryId) {
        const parentCategory = await queryRunner.manager.findOne(CategoriesEntity, {
          where: { id: category.parentCategoryId },
        });
        if (!parentCategory) {
          throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
            code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
          });
        }
        existedCategory.parentCategory = parentCategory;
        await queryRunner.manager.save(existedCategory);
      }

      if (category.subCategoryIds) {
        // const subCategories = await queryRunner.manager.findByIds(
        //   CategoriesEntity,
        //   category.subCategoryIds
        // );
        // if (subCategories.length !== category.subCategoryIds.length) {
        //   throw new NotFoundException({
        //     status: HttpStatus.NOT_FOUND,
        //     message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
        //     code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
        //   });
        // }
        // existedCategory.subCategories = subCategories;
        // await queryRunner.manager.save(existedCategory);

        await validateAndAssignEntities(
          queryRunner.manager,
          CategoriesEntity,
          category.subCategoryIds,
          existedCategory,
          'subCategories',
          {
            status: HttpStatus.NOT_FOUND,
            message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
            code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
          }
        );
        await queryRunner.manager.save(existedCategory);
      }

      const dataNew = await this.getCategoryTreeFromId(
        { categoryId: existedCategory.id },
        queryRunner
      );
      this.logger.debug(`${label} dataNew -> ${JSON.stringify(dataNew)}`);
      if (!dataNew) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
          code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
        });
      }
      await queryRunner.commitTransaction();
      const serialized = serializeTreeAdvanced(
        dataNew.data,
        () => (node) => instanceToPlain(new CategorySerializer(node)),
        'subCategories'
      );
      return serialized[0] as CategoriesEntity;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.CATEGORY.CREATE_ERROR.message;
      const defaultCode = HTTP_RESPONSE.CATEGORY.CREATE_ERROR.code;
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

  async getCategories(payload: { query: DQueryGetListCategory }) {
    const label = '[getCategories]';
    const { textSearch, page, limit, ...otherFilters } = payload.query;

    const searchConditions: Record<string, any> = {};
    if (textSearch && textSearch.trim()) {
      searchConditions.name = textSearch.trim();
    }

    const fieldConfig = {
      idField: 'id',
      parentIdField: 'parentCategoryId',
      childrenField: 'subCategories',
    };

    const config = {
      fieldConfig,
      baseWhere: otherFilters,
      searchConditions: Object.keys(searchConditions).length > 0 ? searchConditions : undefined,
      loadAllChildrenOnSearch: true,
      orderBy: { name: 'ASC' as const },
      includeCount: true,
      countField: 'productCount',
      joinRelation: 'categoryTinies',
      joinField: 'productId',
    };

    const pagination = { page, limit };

    const options: TreeBuilderOptions = {
      ...fieldConfig,
      rootCondition: (item: Partial<CategoriesEntity>) =>
        !item.parentCategoryId || item.parentCategoryId === null,
    };

    const builder = await TreeBuilderFacade.buildAdvancedPaginatedTree(
      this.categoriesRepository,
      config,
      pagination,
      options
    );

    this.logger.debug(`${label} tree -> ${JSON.stringify(builder)}`);

    return {
      total: builder.total,
      page: builder.page,
      limit: builder.limit,
      totalPages: builder.totalPages,
      data: serializeTreeAdvanced(
        builder.data,
        () => (n) => instanceToPlain(new CategorySerializer(n)),
        'subCategories'
      ),
    };
  }

  async updateCategory(payload: { category: IUpdateCategory; categoryId: string }) {
    const label = '[updateCategory]';
    const { category, categoryId } = payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existedCategory = await queryRunner.manager.findOne(CategoriesEntity, {
        where: { id: categoryId },
        relations: ['subCategories'],
      });
      if (!existedCategory) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
          code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
        });
      }
      this.logger.debug(`${label} existedCategory -> ${JSON.stringify(existedCategory)}`);
      existedCategory.name = category.name || existedCategory.name;

      if (category.parentCategoryId) {
        const parentCategory = await queryRunner.manager.findOne(CategoriesEntity, {
          where: { id: category.parentCategoryId },
        });
        if (!parentCategory) {
          throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
            code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
          });
        }
        existedCategory.parentCategory = parentCategory;
      } else {
        existedCategory.parentCategory = null as unknown as CategoriesEntity;
        existedCategory.parentCategoryId = null as unknown as string;
      }

      const subCategories = await queryRunner.manager.find(CategoriesEntity, {
        where: { parentCategoryId: existedCategory.id },
      });

      const newSubCategoryIds = category.subCategoryIds || [];
      const deleteCategories = subCategories
        .filter((sub) => !newSubCategoryIds.includes(sub.id))
        .map((sub) => sub.id);
      this.logger.debug(`${label} deleteCategories -> ${JSON.stringify(deleteCategories)}`);
      if (deleteCategories && deleteCategories.length > 0) {
        await queryRunner.manager.update(
          CategoriesEntity,
          {
            id: In([...deleteCategories]),
          },
          {
            parentCategoryId: null as unknown as string,
            parentCategory: null as unknown as CategoriesEntity,
          }
        );
        this.logger.debug(`${label} delete -> ${deleteCategories.join(', ')}`);
      }

      if (Array.isArray(category.subCategoryIds) && category.subCategoryIds.length > 0) {
        this.logger.debug(
          `${label} category.subCategoryIds -> ${JSON.stringify(category.subCategoryIds)}`
        );
        await validateAndAssignEntities(
          queryRunner.manager,
          CategoriesEntity,
          category.subCategoryIds,
          existedCategory,
          'subCategories',
          {
            status: HttpStatus.NOT_FOUND,
            message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
            code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
          }
        );
      } else {
        existedCategory.subCategories = [];
      }

      await queryRunner.manager.save(existedCategory);
      this.logger.debug(`${label} updatedCategory -> ${JSON.stringify(existedCategory)}`);

      const dataNew = await this.getCategoryTreeFromId(
        { categoryId: existedCategory.id },
        queryRunner
      );
      this.logger.debug(`${label} dataNew -> ${JSON.stringify(dataNew)}`);
      if (!dataNew) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
          code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
        });
      }
      await queryRunner.commitTransaction();
      const serialized = serializeTreeAdvanced(
        dataNew.data,
        () => (node) => instanceToPlain(new CategorySerializer(node)),
        'subCategories'
      );
      return serialized[0] as CategoriesEntity;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.CATEGORY.UPDATE_ERROR.message;
      const defaultCode = HTTP_RESPONSE.CATEGORY.UPDATE_ERROR.code;
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

  async getCategoryTreeFromId(
    payload: { categoryId: string },
    queryRunner?: QueryRunner
  ): Promise<{
    data: CategoriesEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { categoryId } = payload;

    const manager = queryRunner?.manager || this.categoriesRepository.manager;
    const repository = manager.getRepository(CategoriesEntity);

    const targetCategory = await repository.findOne({
      where: { id: categoryId },
    });

    if (!targetCategory) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
        code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
      });
    }

    const rootCategory = await this.findRootCategory(repository, targetCategory);

    const data = await TreeBuilderFacade.createBuilder(repository)
      .fields('id', 'parentCategoryId', 'subCategories')
      .rootCondition((item: CategoriesEntity) => item.id === rootCategory.id)
      .orderBy({ name: 'ASC' })
      .build();

    return data;
  }

  private async findRootCategory(
    repository: Repository<CategoriesEntity>,
    category: CategoriesEntity
  ): Promise<CategoriesEntity> {
    let currentCategory = category;

    while (currentCategory.parentCategoryId) {
      const parentCategory = await repository.findOne({
        where: { id: currentCategory.parentCategoryId },
      });

      if (!parentCategory) {
        break;
      }

      currentCategory = parentCategory;
    }

    return currentCategory;
  }

  async getCategorySubTreeFromId(
    payload: { categoryId: string },
    queryRunner?: QueryRunner
  ): Promise<{
    data: CategoriesEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { categoryId } = payload;

    const manager = queryRunner?.manager || this.categoriesRepository.manager;
    const repository = manager.getRepository(CategoriesEntity);

    const targetCategory = await repository.findOne({
      where: { id: categoryId },
    });

    if (!targetCategory) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
        code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
      });
    }

    const data = await TreeBuilderFacade.createBuilder(repository)
      .fields('id', 'parentCategoryId', 'subCategories')
      .rootCondition((item: CategoriesEntity) => item.id === categoryId)
      .orderBy({ name: 'ASC' })
      .build();

    return data;
  }

  async getCategoryTreeWithHighlight(
    payload: { categoryId: string },
    queryRunner?: QueryRunner
  ): Promise<{
    data: (CategoriesEntity & { isTarget?: boolean })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    targetPath: string[];
  }> {
    const { categoryId } = payload;

    const manager = queryRunner?.manager || this.categoriesRepository.manager;
    const repository = manager.getRepository(CategoriesEntity);

    const targetCategory = await repository.findOne({
      where: { id: categoryId },
    });

    if (!targetCategory) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
        code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
      });
    }

    const rootCategory = await this.findRootCategory(repository, targetCategory);

    const result = await TreeBuilderFacade.createBuilder(repository)
      .fields('id', 'parentCategoryId', 'subCategories')
      .rootCondition((item: CategoriesEntity) => item.id === rootCategory.id)
      .orderBy({ name: 'ASC' })
      .build();

    const targetPath = await this.getPathToCategory(repository, categoryId, rootCategory.id);

    const dataWithHighlight = this.highlightTargetInTree(result.data, categoryId);

    return {
      ...result,
      data: dataWithHighlight,
      targetPath,
    };
  }

  private async getPathToCategory(
    repository: Repository<CategoriesEntity>,
    targetCategoryId: string,
    rootCategoryId: string
  ): Promise<string[]> {
    const path: string[] = [];
    let currentId = targetCategoryId;

    while (currentId && currentId !== rootCategoryId) {
      path.unshift(currentId);

      const category = await repository.findOne({
        where: { id: currentId },
      });

      if (!category || !category.parentCategoryId) {
        break;
      }

      currentId = category.parentCategoryId;
    }

    if (currentId === rootCategoryId) {
      path.unshift(rootCategoryId);
    }

    return path;
  }

  private highlightTargetInTree(
    tree: CategoriesEntity[],
    targetId: string
  ): (CategoriesEntity & { isTarget?: boolean })[] {
    return tree.map((item) => {
      const enhanced = {
        ...item,
        isTarget: item.id === targetId,
      } as CategoriesEntity & { isTarget?: boolean };

      if (item.subCategories && item.subCategories.length > 0) {
        enhanced.subCategories = this.highlightTargetInTree(item.subCategories, targetId);
      }

      return enhanced;
    });
  }

  async deleteCategory(payload: { categoryId: string }) {
    const label = '[deleteCategory]';
    const { categoryId } = payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existedCategory = await queryRunner.manager.findOne(CategoriesEntity, {
        where: { id: categoryId },
      });
      if (!existedCategory) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
          code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
        });
      }
      this.logger.debug(`${label} existedCategory -> ${JSON.stringify(existedCategory)}`);

      const subCategories = await queryRunner.manager.find(CategoriesEntity, {
        where: { parentCategoryId: existedCategory.id },
      });

      const deleteCategories = subCategories.map((sub) => sub.id);
      this.logger.debug(`${label} deleteCategories -> ${JSON.stringify(deleteCategories)}`);
      if (deleteCategories && deleteCategories.length > 0) {
        await queryRunner.manager.update(
          CategoriesEntity,
          {
            id: In([...deleteCategories]),
          },
          {
            parentCategoryId: null as unknown as string,
            parentCategory: undefined as unknown as CategoriesEntity,
          }
        );
        this.logger.debug(`${label} delete -> ${deleteCategories.join(', ')}`);
      }

      await queryRunner.manager.softDelete(CategoriesEntity, { id: categoryId });
      this.logger.debug(`${label} deletedCategory -> ${JSON.stringify(existedCategory)}`);

      await queryRunner.commitTransaction();
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      const errorMessage =
        error instanceof Error ? error.message : HTTP_RESPONSE.CATEGORY.DELETE_ERROR.message;
      const defaultCode = HTTP_RESPONSE.CATEGORY.DELETE_ERROR.code;
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

  async getDetailCategory(payload: { categoryId: string }) {
    const label = '[getDetailCategory]';
    const { categoryId } = payload;

    const mainCategory = await this.categoriesRepository
      .createQueryBuilder('c')
      .select(['c.id', 'c.createdAt', 'c.updatedAt', 'c.name', 'c.parentCategoryId'])
      .where('c.id = :categoryId', { categoryId })
      .getOne();

    if (!mainCategory) {
      this.logger.error(`${label} error: ${HTTP_RESPONSE.CATEGORY.NOT_FOUND.message}`);
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
        code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
      });
    }

    const subCategories = await this.getSubCategoriesRecursive(categoryId);

    const mainCategoryProducts = await this.getProductsForCategory(categoryId);

    const result = {
      ...mainCategory,
      subCategories: subCategories,
      products: mainCategoryProducts,
    };

    this.logger.debug(`${label} result -> ${JSON.stringify(result)}`);
    return result;
  }

  private async getSubCategoriesRecursive(parentCategoryId: string): Promise<any[]> {
    const subCategories = await this.categoriesRepository
      .createQueryBuilder('c')
      .select(['c.id', 'c.createdAt', 'c.updatedAt', 'c.name', 'c.parentCategoryId'])
      .where('c.parentCategoryId = :parentCategoryId', { parentCategoryId })
      .getMany();

    const result: any[] = [];
    for (const subCategory of subCategories) {
      const nestedSubCategories = await this.getSubCategoriesRecursive(subCategory.id);
      const products = await this.getProductsForCategory(subCategory.id);

      result.push({
        ...subCategory,
        subCategories: nestedSubCategories,
        products: products,
      });
    }

    return result;
  }

  private async getProductsForCategory(categoryId: string): Promise<any[]> {
    const productsQuery = this.dataSource
      .createQueryBuilder()
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
      .from(ProductsEntity, 'p')
      .innerJoin(CategoryTinyEntity, 'ct', 'ct.productId = p.id')
      .where('ct.categoryId = :categoryId', { categoryId });

    const products = await productsQuery.getRawMany();

    const result: Array<{ [key: string]: any; medias: any[] }> = [];
    for (const product of products as Array<{ id: string }>) {
      const medias = await this.getMediasForProduct(product.id);
      result.push({
        ...product,
        medias: medias,
      });
    }

    return result;
  }

  private async getMediasForProduct(productId: string): Promise<any[]> {
    const mediasQuery = this.dataSource
      .createQueryBuilder()
      .select([
        'm.id as id',
        'm.mediaUrl as mediaUrl',
        'a.name as fileName',
        'b.byte_size as fileSize',
      ])
      .from(MediaItemsEntity, 'm')
      .leftJoin(
        ActiveStorageAttachmentsEntity,
        'a',
        'a.recordId = m.id AND a.recordType = :recordType'
      )
      .leftJoin(ActiveStorageBlobsEntity, 'b', 'b.id = a.blobId')
      .where('m.resourceId = :productId', { productId })
      .andWhere('m.resourceType = :resourceType', { resourceType: ResourceMediaTypeEnum.PRODUCT })
      .andWhere('m.mediaType = :mediaType', { mediaType: MediaTypeEnum.PRODUCT_IMAGE })
      .setParameters({
        recordType: RecordTypeFileEnum.MEDIA,
        resourceType: ResourceMediaTypeEnum.PRODUCT,
        mediaType: MediaTypeEnum.PRODUCT_IMAGE,
      });

    return await mediasQuery.getRawMany();
  }

  async applyProductsForCategory(payload: { categoryId: string; productIds: string[] }) {
    const label = '[applyProductForCategory]';
    const { categoryId, productIds } = payload;

    const existedCategory = await this.categoriesRepository.findOne({
      where: {
        id: categoryId,
      },
    });

    if (!existedCategory) {
      this.logger.error(`${label} error: ${HTTP_RESPONSE.CATEGORY.NOT_FOUND.message}`);
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.CATEGORY.NOT_FOUND.message,
        code: HTTP_RESPONSE.CATEGORY.NOT_FOUND.code,
      });
    }

    const uniqueProductIds = Array.from(new Set(productIds));
    const existedProducts = await this.productRepository.find({
      where: {
        id: In(uniqueProductIds),
      },
    });
    this.logger.debug(`${label} existedProducts.length -> ${existedProducts.length}`);

    if (existedProducts.length !== uniqueProductIds.length) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.PRODUCT.NOT_FOUND.message,
        code: HTTP_RESPONSE.PRODUCT.NOT_FOUND.code,
      });
    }

    const existingLinks = await this.categoryTinyRepository.find({
      where: {
        categoryId,
        productId: In(uniqueProductIds),
      },
    });

    const existingProductIds = new Set(existingLinks.map((link) => link.productId));

    const newLinks = uniqueProductIds
      .filter((productId) => !existingProductIds.has(productId))
      .map((productId) => ({
        categoryId,
        productId,
      }));

    if (newLinks.length > 0) {
      await this.categoryTinyRepository.save(newLinks);
    }

    const result = await this.getProductsForCategory(categoryId);
    return result as unknown[];
  }

  async removeProductsForCategory(payload: { categoryId: string; productIds: string[] }) {
    const label = '[removeProductForCategory]';
    const { categoryId, productIds } = payload;
    const uniqueProductIds = Array.from(new Set(productIds));

    const existingLinks = await this.categoryTinyRepository.find({
      where: uniqueProductIds.map((productId) => ({
        categoryId,
        productId,
      })),
    });

    if (existingLinks.length === 0) {
      this.logger.error(
        `${label} error: ${HTTP_RESPONSE.CATEGORY.CATEGORY_PRODUCT_LINK_NOT_FOUND.message}`
      );
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.CATEGORY.CATEGORY_PRODUCT_LINK_NOT_FOUND.message,
        code: HTTP_RESPONSE.CATEGORY.CATEGORY_PRODUCT_LINK_NOT_FOUND.code,
      });
    }

    const existingProductIds = existingLinks.map((link) => link.productId);

    await this.categoryTinyRepository
      .createQueryBuilder()
      .softDelete()
      .where('categoryId = :categoryId', { categoryId })
      .andWhere('productId IN (:...productIds)', { productIds: existingProductIds })
      .execute();

    return true;
  }
}
