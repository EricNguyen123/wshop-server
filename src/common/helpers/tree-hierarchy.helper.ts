import { Logger } from '@nestjs/common';
import { CountConfig, QueryConfig, TreeFieldConfig } from 'src/types/tree.types';
import { Repository } from 'typeorm';
import { QueryBuilder } from './builders/query.builder';
import { ResultProcessor } from './processors/result.processor';

export class TreeHierarchyService {
  private static readonly logger = new Logger(TreeHierarchyService.name, { timestamp: true });

  static async getAncestors<T extends Record<string, any>>(
    repository: Repository<any>,
    childIds: string[],
    fieldConfig: TreeFieldConfig,
    queryConfig: Partial<QueryConfig> = {},
    countConfig?: CountConfig
  ): Promise<T[]> {
    if (childIds.length === 0) return [];

    const { idField, parentIdField } = fieldConfig;
    const ancestors: T[] = [];
    const processedIds = new Set<string>();

    const getParents = async (currentChildIds: string[]): Promise<void> => {
      if (currentChildIds.length === 0) return;

      const currentItems = await repository
        .createQueryBuilder('entity')
        .where(`entity.${idField} IN (:...childIds)`, { childIds: currentChildIds })
        .getMany();

      const parentIds = this.extractParentIds(currentItems, parentIdField);
      if (parentIds.length === 0) return;

      let parentQuery = QueryBuilder.createBaseQuery(repository);
      parentQuery = parentQuery.where(`entity.${idField} IN (:...parentIds)`, { parentIds });

      if (countConfig) {
        parentQuery = QueryBuilder.applyCountJoin(parentQuery, countConfig);
      }

      if (queryConfig.baseWhere) {
        parentQuery = QueryBuilder.applyWhereConditions(
          parentQuery,
          queryConfig.baseWhere,
          'entity',
          'ancestor'
        );
      }

      QueryBuilder.logQuery(parentQuery, 'Ancestors');

      const parents = countConfig?.includeCount
        ? ResultProcessor.processRawResults<T>(await parentQuery.getRawMany(), countConfig)
        : ((await parentQuery.getMany()) as T[]);

      const newParentIds: string[] = [];
      parents.forEach((parent) => {
        const parentId = String(parent[idField]);
        if (!processedIds.has(parentId)) {
          ancestors.push(parent);
          processedIds.add(parentId);
          newParentIds.push(parentId);
        }
      });

      await getParents(newParentIds);
    };

    await getParents(childIds);
    return ancestors;
  }

  static async getDescendants<T extends Record<string, any>>(
    repository: Repository<any>,
    parentIds: string[],
    fieldConfig: TreeFieldConfig,
    queryConfig: Partial<QueryConfig> = {},
    countConfig?: CountConfig
  ): Promise<T[]> {
    if (parentIds.length === 0) return [];

    const { idField, parentIdField } = fieldConfig;
    const descendants: T[] = [];
    const processedIds = new Set<string>();

    const getChildren = async (currentParentIds: string[]): Promise<void> => {
      if (currentParentIds.length === 0) return;

      let childQuery = QueryBuilder.createBaseQuery(repository);
      childQuery = childQuery.where(`entity.${parentIdField} IN (:...parentIds)`, {
        parentIds: currentParentIds,
      });

      if (countConfig) {
        childQuery = QueryBuilder.applyCountJoin(childQuery, countConfig);
      }

      if (queryConfig.baseWhere) {
        childQuery = QueryBuilder.applyWhereConditions(
          childQuery,
          queryConfig.baseWhere,
          'entity',
          'desc'
        );
      }

      QueryBuilder.logQuery(childQuery, 'Descendants');

      const children = countConfig?.includeCount
        ? ResultProcessor.processRawResults<T>(await childQuery.getRawMany(), countConfig)
        : ((await childQuery.getMany()) as T[]);

      this.logger.debug(
        `Found ${children.length} children for parent IDs: ${currentParentIds.join(', ')}`
      );

      if (children.length === 0) return;

      const newChildIds: string[] = [];
      children.forEach((child) => {
        const childId = String(child[idField]);
        if (!processedIds.has(childId)) {
          descendants.push(child);
          processedIds.add(childId);
          newChildIds.push(childId);
        }
      });

      await getChildren(newChildIds);
    };

    await getChildren(parentIds);
    this.logger.debug(`Total descendants found: ${descendants.length}`);
    return descendants;
  }

  static async getAllRelatedItems<T extends Record<string, any>>(
    repository: Repository<any>,
    matchingIds: string[],
    fieldConfig: TreeFieldConfig,
    queryConfig: Partial<QueryConfig> = {},
    countConfig?: CountConfig
  ): Promise<T[]> {
    if (matchingIds.length === 0) return [];

    const { idField } = fieldConfig;
    const relatedItems: T[] = [];
    const processedIds = new Set<string>(matchingIds);

    const ancestors = await this.getAncestors<T>(
      repository,
      matchingIds,
      fieldConfig,
      queryConfig,
      countConfig
    );

    ancestors.forEach((item) => {
      const itemId = String(item[idField]);
      if (!processedIds.has(itemId)) {
        relatedItems.push(item);
        processedIds.add(itemId);
      }
    });

    const allIds = Array.from(processedIds);
    const descendants = await this.getDescendants<T>(
      repository,
      allIds,
      fieldConfig,
      queryConfig,
      countConfig
    );

    descendants.forEach((item) => {
      const itemId = String(item[idField]);
      if (!processedIds.has(itemId)) {
        relatedItems.push(item);
        processedIds.add(itemId);
      }
    });

    return relatedItems;
  }

  private static extractParentIds<T extends Record<string, any>>(
    items: T[],
    parentIdField: string
  ): string[] {
    return items
      .map((item) => item[parentIdField] as string | null | undefined)
      .filter((parentId) => parentId !== null && parentId !== undefined)
      .map((parentId) => String(parentId));
  }
}
