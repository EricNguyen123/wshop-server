import { Logger } from '@nestjs/common';
import {
  CountConfig,
  PaginatedTreeResult,
  PaginationConfig,
  QueryConfig,
  SearchConfig,
  TreeBuilderConfig,
  TreeBuilderOptions,
  TreeFieldConfig,
} from 'src/types/tree.types';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TreeBuilderService } from '../tree-builder.helper';
import { TreePaginationService } from '../tree-pagination.helper';

export class TreeBuilderFacade {
  private static readonly logger = new Logger(TreeBuilderFacade.name, { timestamp: true });

  static buildTree<T extends Record<string, any>>(
    items: T[],
    options: TreeBuilderOptions = {}
  ): T[] {
    return TreeBuilderService.buildTree(items, options);
  }

  static async buildPaginatedTreeFromQuery<T extends Record<string, any>>(
    queryBuilder: SelectQueryBuilder<any>,
    pagination: Partial<PaginationConfig> = {},
    options: TreeBuilderOptions = {}
  ): Promise<PaginatedTreeResult<T>> {
    return TreePaginationService.buildPaginatedTreeFromQueryBuilder(
      queryBuilder,
      pagination,
      options
    );
  }

  static async buildAdvancedPaginatedTree<T extends Record<string, any>>(
    repository: Repository<T>,
    config: {
      fieldConfig?: Partial<TreeFieldConfig>;
      baseWhere?: Record<string, any>;
      searchConditions?: Record<string, any>;
      loadAllChildrenOnSearch?: boolean;
      orderBy?: Record<string, 'ASC' | 'DESC'>;
      includeCount?: boolean;
      countField?: string;
      joinRelation?: string;
      joinField?: string;
    } = {},
    pagination: Partial<PaginationConfig> = {},
    options: TreeBuilderOptions = {}
  ): Promise<PaginatedTreeResult<T>> {
    const fieldConfig: TreeFieldConfig = {
      idField: config.fieldConfig?.idField || 'id',
      parentIdField: config.fieldConfig?.parentIdField || 'parentId',
      childrenField: config.fieldConfig?.childrenField || 'children',
    };

    const queryConfig: Partial<QueryConfig> = {
      baseWhere: config.baseWhere || {},
      orderBy: config.orderBy || {},
    };

    const countConfig: CountConfig | undefined = config.includeCount
      ? {
          includeCount: true,
          countField: config.countField || 'productCount',
          joinRelation: config.joinRelation || 'categoryTinies',
          joinField: config.joinField || 'productId',
        }
      : undefined;

    const searchConfig: SearchConfig | undefined = config.searchConditions
      ? {
          conditions: config.searchConditions,
          loadAllChildrenOnSearch: config.loadAllChildrenOnSearch ?? true,
        }
      : undefined;

    const builderConfig: TreeBuilderConfig<T> = {
      repository,
      fieldConfig,
      countConfig,
      queryConfig,
    };

    return TreePaginationService.buildTreeWithManualPagination(
      builderConfig,
      pagination,
      searchConfig,
      options
    );
  }

  static flattenTree<T extends Record<string, any>>(tree: T[], childrenField = 'children'): T[] {
    return TreeBuilderService.flattenTree(tree, childrenField);
  }

  static findInTree<T extends Record<string, any>>(
    tree: T[],
    id: string,
    idField = 'id',
    childrenField = 'children'
  ): T | null {
    return TreeBuilderService.findInTree(tree, id, idField, childrenField);
  }

  static getParentIds<T extends Record<string, any>>(
    items: T[],
    itemId: string,
    idField = 'id',
    parentIdField = 'parentId'
  ): string[] {
    return TreeBuilderService.getParentIds(items, itemId, idField, parentIdField);
  }

  static getTreeDepth<T extends Record<string, any>>(
    tree: T[],
    childrenField = 'children'
  ): number {
    return TreeBuilderService.getTreeDepth(tree, childrenField);
  }

  static filterTree<T extends Record<string, any>>(
    tree: T[],
    predicate: (item: T) => boolean,
    childrenField = 'children'
  ): T[] {
    return TreeBuilderService.filterTree(tree, predicate, childrenField);
  }

  static createBuilder<T extends Record<string, any>>(
    repository: Repository<T>
  ): TreeBuilderFluentInterface<T> {
    return new TreeBuilderFluentInterface(repository);
  }
}

export class TreeBuilderFluentInterface<T extends Record<string, any>> {
  private config: Partial<TreeBuilderConfig<T>> = {};
  private paginationConfig: Partial<PaginationConfig> = {};
  private searchConfig?: SearchConfig;
  private builderOptions: TreeBuilderOptions = {};

  constructor(repository: Repository<T>) {
    this.config.repository = repository;
    this.config.fieldConfig = {
      idField: 'id',
      parentIdField: 'parentId',
      childrenField: 'children',
    };
  }

  fields(idField: string, parentIdField: string, childrenField: string): this {
    this.config.fieldConfig = { idField, parentIdField, childrenField };
    return this;
  }

  where(conditions: Record<string, any>): this {
    this.config.queryConfig = {
      ...this.config.queryConfig,
      baseWhere: conditions,
    };
    return this;
  }

  orderBy(orderBy: Record<string, 'ASC' | 'DESC'>): this {
    this.config.queryConfig = {
      ...this.config.queryConfig,
      orderBy,
    };
    return this;
  }

  search(conditions: Record<string, any>, loadAllChildren = true): this {
    this.searchConfig = { conditions, loadAllChildrenOnSearch: loadAllChildren };
    return this;
  }

  withCount(
    countField = 'productCount',
    joinRelation = 'categoryTinies',
    joinField = 'productId'
  ): this {
    this.config.countConfig = {
      includeCount: true,
      countField,
      joinRelation,
      joinField,
    };
    return this;
  }

  paginate(page: number, limit?: number): this {
    this.paginationConfig = {
      page,
      ...(limit !== undefined ? { limit } : {}),
    };
    return this;
  }

  page(page: number): this {
    this.paginationConfig = { page };
    return this;
  }

  all(): this {
    this.paginationConfig = { page: 1 };
    return this;
  }

  sort(sortFn: (a: T, b: T) => number): this {
    this.builderOptions.sortFn = sortFn;
    return this;
  }

  rootCondition(condition: (item: T) => boolean): this {
    this.builderOptions.rootCondition = condition;
    if (this.config.fieldConfig) {
      this.builderOptions.idField = this.config.fieldConfig.idField;
      this.builderOptions.parentIdField = this.config.fieldConfig.parentIdField;
      this.builderOptions.childrenField = this.config.fieldConfig.childrenField;
    }
    return this;
  }

  async build(): Promise<PaginatedTreeResult<T>> {
    if (!this.config.repository || !this.config.fieldConfig) {
      throw new Error('Repository and field configuration are required');
    }

    return TreePaginationService.buildTreeWithManualPagination(
      this.config as TreeBuilderConfig<T>,
      this.paginationConfig,
      this.searchConfig,
      this.builderOptions
    );
  }
}
