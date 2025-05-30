/* eslint-disable @typescript-eslint/no-unused-vars */
// Cập nhật TreePaginationService để xử lý trường hợp không có limit

import { Logger } from '@nestjs/common';
import { DEFAULT_PAGE } from 'src/constants/base.constant';
import {
  PaginatedTreeResult,
  PaginationConfig,
  SearchConfig,
  TreeBuilderConfig,
  TreeBuilderOptions,
} from 'src/types/tree.types';
import { SelectQueryBuilder } from 'typeorm';
import { TreeBuilderService } from './tree-builder.helper';
import { QueryBuilder } from './builders/query.builder';
import { ResultProcessor } from './processors/result.processor';
import { TreeHierarchyService } from './tree-hierarchy.helper';

export class TreePaginationService {
  private static readonly logger = new Logger(TreePaginationService.name, { timestamp: true });

  static async buildPaginatedTreeFromQueryBuilder<T extends Record<string, any>>(
    queryBuilder: SelectQueryBuilder<any>,
    pagination: Partial<PaginationConfig>,
    options: TreeBuilderOptions = {}
  ): Promise<PaginatedTreeResult<T>> {
    const page = Math.max(1, pagination.page || DEFAULT_PAGE);
    const limit = pagination.limit || null;

    const allItems = await queryBuilder.getRawMany();
    const completeTree = TreeBuilderService.buildTree<T>(allItems, options);

    const parentIdField = options.parentIdField || 'parentId';
    const rootItems = completeTree.filter(
      (item: T) => !item[parentIdField] || item[parentIdField] === null
    );

    if (!limit) {
      this.logger.debug(
        `[buildPaginatedTreeFromQueryBuilder] No limit specified, returning all ${rootItems.length} root items`
      );

      return {
        data: rootItems,
        total: rootItems.length,
        page: 1,
        limit: rootItems.length,
        totalPages: 1,
      };
    }

    const offset = (page - 1) * limit;
    const paginatedRootItems = rootItems.slice(offset, offset + limit);

    this.logger.debug(
      `[buildPaginatedTreeFromQueryBuilder] Total roots: ${rootItems.length}, Page: ${page}, Limit: ${limit}, Returned: ${paginatedRootItems.length}`
    );

    return {
      data: paginatedRootItems,
      total: rootItems.length,
      page,
      limit,
      totalPages: Math.ceil(rootItems.length / limit),
    };
  }

  static async buildTreeWithManualPagination<T extends Record<string, any>>(
    config: TreeBuilderConfig<T>,
    pagination: Partial<PaginationConfig>,
    searchConfig?: SearchConfig,
    options: TreeBuilderOptions = {}
  ): Promise<PaginatedTreeResult<T>> {
    const { repository, fieldConfig, countConfig, queryConfig } = config;
    const page = Math.max(1, pagination.page || DEFAULT_PAGE);
    const limit = pagination?.limit || null;

    const hasSearchConditions = searchConfig && Object.keys(searchConfig.conditions).length > 0;

    this.logger.debug(
      `[buildTreeWithManualPagination] Page: ${page}, Limit: ${limit}, HasSearch: ${hasSearchConditions}`
    );

    if (hasSearchConditions && searchConfig.loadAllChildrenOnSearch) {
      return this.handleSearchWithAllChildren(
        config,
        pagination,
        searchConfig,
        options,
        page,
        limit
      );
    } else {
      return this.handleRegularPagination(config, pagination, searchConfig, options, page, limit);
    }
  }

  private static async handleSearchWithAllChildren<T extends Record<string, any>>(
    config: TreeBuilderConfig<T>,
    pagination: Partial<PaginationConfig>,
    searchConfig: SearchConfig,
    options: TreeBuilderOptions,
    page: number,
    limit: number | null
  ): Promise<PaginatedTreeResult<T>> {
    const { repository, fieldConfig, countConfig, queryConfig } = config;

    let searchQuery = QueryBuilder.createBaseQuery(repository);

    if (countConfig) {
      searchQuery = QueryBuilder.applyCountJoin(searchQuery, countConfig);
    }

    if (queryConfig?.baseWhere) {
      searchQuery = QueryBuilder.applyWhereConditions(searchQuery, queryConfig.baseWhere);
    }

    searchQuery = QueryBuilder.applySearchConditions(searchQuery, searchConfig);

    if (queryConfig?.orderBy) {
      searchQuery = QueryBuilder.applyOrderBy(searchQuery, queryConfig.orderBy);
    }

    QueryBuilder.logQuery(searchQuery, 'Search');

    const allMatchingItems = countConfig?.includeCount
      ? ResultProcessor.processRawResults<T>(await searchQuery.getRawMany(), countConfig)
      : await searchQuery.getMany();

    this.logger.debug(
      `[handleSearchWithAllChildren] Found ${allMatchingItems.length} items matching search criteria`
    );

    if (allMatchingItems.length === 0) {
      return this.createEmptyResult(page, limit);
    }

    const matchingIds = ResultProcessor.extractIds(allMatchingItems, fieldConfig.idField);
    const allRelatedItems = await TreeHierarchyService.getAllRelatedItems<T>(
      repository,
      matchingIds,
      fieldConfig,
      queryConfig,
      countConfig
    );

    const allItems = ResultProcessor.mergeResults(allMatchingItems, allRelatedItems);
    const uniqueItems = ResultProcessor.removeDuplicates(allItems, fieldConfig.idField);

    const completeTree = TreeBuilderService.buildTree<T>(uniqueItems, options);

    const rootNodes = completeTree.filter(
      (item: T) =>
        !item[fieldConfig.parentIdField as keyof T] ||
        item[fieldConfig.parentIdField as keyof T] === null
    );

    if (!limit) {
      this.logger.debug(
        `[handleSearchWithAllChildren] No limit specified, returning all ${rootNodes.length} root nodes`
      );

      return {
        data: rootNodes,
        total: rootNodes.length,
        page: 1,
        limit: rootNodes.length,
        totalPages: 1,
      };
    }

    const offset = (page - 1) * limit;
    const paginatedRootNodes = rootNodes.slice(offset, offset + limit);

    this.logger.debug(
      `[handleSearchWithAllChildren] Total roots: ${rootNodes.length}, Paginated: ${paginatedRootNodes.length}, Page: ${page}, Limit: ${limit}`
    );

    return {
      data: paginatedRootNodes,
      total: rootNodes.length,
      page,
      limit,
      totalPages: Math.ceil(rootNodes.length / limit),
    };
  }

  private static async handleRegularPagination<T extends Record<string, any>>(
    config: TreeBuilderConfig<T>,
    pagination: Partial<PaginationConfig>,
    searchConfig: SearchConfig | undefined,
    options: TreeBuilderOptions,
    page: number,
    limit: number | null
  ): Promise<PaginatedTreeResult<T>> {
    const { repository, fieldConfig, countConfig, queryConfig } = config;

    const baseWhereConditions = queryConfig?.baseWhere || {};
    const rootWhereConditions = {
      ...baseWhereConditions,
      [fieldConfig.parentIdField]: null,
    };

    let totalCountQuery = QueryBuilder.createBaseQuery(repository);
    totalCountQuery = QueryBuilder.applyWhereConditions(totalCountQuery, rootWhereConditions);

    if (searchConfig && Object.keys(searchConfig.conditions).length > 0) {
      totalCountQuery = QueryBuilder.applySearchConditions(totalCountQuery, searchConfig);
    }

    const totalRoots = await totalCountQuery.getCount();
    this.logger.debug(`[handleRegularPagination] Total root items: ${totalRoots}`);

    if (totalRoots === 0) {
      return this.createEmptyResult(page, limit);
    }

    if (!limit) {
      return this.getAllRootItems(config, searchConfig, options, totalRoots);
    }

    const offset = (page - 1) * limit;

    let rootIdsQuery = QueryBuilder.createBaseQuery(repository);
    rootIdsQuery = QueryBuilder.applyWhereConditions(rootIdsQuery, rootWhereConditions);

    if (searchConfig && Object.keys(searchConfig.conditions).length > 0) {
      rootIdsQuery = QueryBuilder.applySearchConditions(rootIdsQuery, searchConfig);
    }

    if (queryConfig?.orderBy) {
      rootIdsQuery = QueryBuilder.applyOrderBy(rootIdsQuery, queryConfig.orderBy);
    }

    rootIdsQuery = QueryBuilder.applyPagination(rootIdsQuery, page, limit);
    rootIdsQuery = rootIdsQuery.select(`entity.${fieldConfig.idField}`);

    QueryBuilder.logQuery(rootIdsQuery, 'Root IDs Query');

    const rootIdResults: Record<string, unknown>[] = await rootIdsQuery.getRawMany();
    const rootIds = rootIdResults.map((row) => {
      const key = `entity_${fieldConfig.idField}`;
      return row[key];
    });

    this.logger.debug(
      `[handleRegularPagination] Retrieved ${rootIds.length} root IDs for page ${page} (limit: ${limit})`
    );

    if (rootIds.length === 0) {
      return {
        data: [],
        total: totalRoots,
        page,
        limit,
        totalPages: Math.ceil(totalRoots / limit),
      };
    }

    let rootQuery = QueryBuilder.createBaseQuery(repository);

    if (countConfig) {
      rootQuery = QueryBuilder.applyCountJoin(rootQuery, countConfig);
    }

    rootQuery = rootQuery.where(`entity.${fieldConfig.idField} IN (:...rootIds)`, { rootIds });

    if (queryConfig?.orderBy) {
      rootQuery = QueryBuilder.applyOrderBy(rootQuery, queryConfig.orderBy);
    }

    QueryBuilder.logQuery(rootQuery, 'Root Items Query');

    let rootItems: T[] = [];
    if (countConfig?.includeCount) {
      const rawResults = await rootQuery.getRawMany();
      rootItems = ResultProcessor.processRawResults<T>(rawResults, countConfig);
    } else {
      rootItems = await rootQuery.getMany();
    }

    this.logger.debug(
      `[handleRegularPagination] Retrieved ${rootItems.length} root items with data`
    );

    if (rootItems.length > 0) {
      const rootItemIds = ResultProcessor.extractIds(rootItems, fieldConfig.idField);
      const allDescendants = await TreeHierarchyService.getDescendants<T>(
        repository,
        rootItemIds,
        fieldConfig,
        queryConfig,
        countConfig
      );

      const allItems = ResultProcessor.mergeResults(rootItems, allDescendants);
      this.logger.debug(
        `[handleRegularPagination] Building tree with ${allItems.length} total items (${rootItems.length} roots + ${allDescendants.length} descendants)`
      );

      const treeData = TreeBuilderService.buildTree<T>(allItems, options);

      const orderedResult = rootIds
        .map((rootId) =>
          treeData.find((item) => String(item[fieldConfig.idField as keyof T]) === String(rootId))
        )
        .filter(Boolean) as T[];

      this.logger.debug(
        `[handleRegularPagination] Returning ${orderedResult.length} root items (requested limit: ${limit})`
      );

      return {
        data: orderedResult,
        total: totalRoots,
        page,
        limit,
        totalPages: Math.ceil(totalRoots / limit),
      };
    }

    return {
      data: [],
      total: totalRoots,
      page,
      limit,
      totalPages: Math.ceil(totalRoots / limit),
    };
  }

  private static async getAllRootItems<T extends Record<string, any>>(
    config: TreeBuilderConfig<T>,
    searchConfig: SearchConfig | undefined,
    options: TreeBuilderOptions,
    totalRoots: number
  ): Promise<PaginatedTreeResult<T>> {
    const { repository, fieldConfig, countConfig, queryConfig } = config;

    const baseWhereConditions = queryConfig?.baseWhere || {};
    const rootWhereConditions = {
      ...baseWhereConditions,
      [fieldConfig.parentIdField]: null,
    };

    let rootQuery = QueryBuilder.createBaseQuery(repository);
    rootQuery = QueryBuilder.applyWhereConditions(rootQuery, rootWhereConditions);

    if (searchConfig && Object.keys(searchConfig.conditions).length > 0) {
      rootQuery = QueryBuilder.applySearchConditions(rootQuery, searchConfig);
    }

    if (countConfig) {
      rootQuery = QueryBuilder.applyCountJoin(rootQuery, countConfig);
    }

    if (queryConfig?.orderBy) {
      rootQuery = QueryBuilder.applyOrderBy(rootQuery, queryConfig.orderBy);
    }

    QueryBuilder.logQuery(rootQuery, 'All Root Items Query');

    let rootItems: T[] = [];
    if (countConfig?.includeCount) {
      const rawResults = await rootQuery.getRawMany();
      rootItems = ResultProcessor.processRawResults<T>(rawResults, countConfig);
    } else {
      rootItems = await rootQuery.getMany();
    }

    this.logger.debug(
      `[getAllRootItems] Retrieved ${rootItems.length} root items without pagination`
    );

    if (rootItems.length > 0) {
      const rootItemIds = ResultProcessor.extractIds(rootItems, fieldConfig.idField);
      const allDescendants = await TreeHierarchyService.getDescendants<T>(
        repository,
        rootItemIds,
        fieldConfig,
        queryConfig,
        countConfig
      );

      const allItems = ResultProcessor.mergeResults(rootItems, allDescendants);
      this.logger.debug(
        `[getAllRootItems] Building tree with ${allItems.length} total items (${rootItems.length} roots + ${allDescendants.length} descendants)`
      );

      const treeData = TreeBuilderService.buildTree<T>(allItems, options);

      this.logger.debug(
        `[getAllRootItems] Returning all ${treeData.length} root items without pagination`
      );

      return {
        data: treeData,
        total: totalRoots,
        page: 1,
        limit: totalRoots,
        totalPages: 1,
      };
    }

    return {
      data: [],
      total: totalRoots,
      page: 1,
      limit: totalRoots,
      totalPages: totalRoots > 0 ? 1 : 0,
    };
  }

  private static createEmptyResult<T>(page: number, limit: number | null): PaginatedTreeResult<T> {
    return {
      data: [],
      total: 0,
      page,
      limit: limit || 0,
      totalPages: 0,
    };
  }
}
