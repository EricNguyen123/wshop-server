import { Logger } from '@nestjs/common';
import { CountConfig, SearchConfig } from 'src/types/tree.types';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

export class QueryBuilder {
  private static readonly logger = new Logger(QueryBuilder.name, { timestamp: true });

  static createBaseQuery<T extends ObjectLiteral>(
    repository: Repository<T>,
    alias = 'entity'
  ): SelectQueryBuilder<T> {
    return repository.createQueryBuilder(alias);
  }

  static applyCountJoin<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    countConfig: CountConfig,
    alias = 'entity'
  ): SelectQueryBuilder<T> {
    if (!countConfig.includeCount) return query;

    const { countField, joinRelation = 'categoryTinies', joinField = 'productId' } = countConfig;

    return query
      .leftJoin(`${alias}.${joinRelation}`, joinRelation)
      .addSelect(`COUNT(DISTINCT ${joinRelation}.${joinField})`, countField)
      .groupBy(`${alias}.id`);
  }

  static applyWhereConditions<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    conditions: Record<string, any>,
    alias = 'entity',
    paramPrefix = ''
  ): SelectQueryBuilder<T> {
    let isFirst = true;

    Object.entries(conditions).forEach(([key, value]) => {
      const paramKey = paramPrefix ? `${paramPrefix}_${key}` : key;
      const condition = this.buildCondition(key, value, paramKey, alias);

      if (isFirst) {
        query = condition.isNull
          ? query.where(condition.sql)
          : query.where(condition.sql, condition.params);
        isFirst = false;
      } else {
        query = condition.isNull
          ? query.andWhere(condition.sql)
          : query.andWhere(condition.sql, condition.params);
      }
    });

    return query;
  }

  static applySearchConditions<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    searchConfig: SearchConfig,
    alias = 'entity'
  ): SelectQueryBuilder<T> {
    Object.entries(searchConfig.conditions).forEach(([key, value], index) => {
      const paramKey = `search_${key}_${index}`;
      const condition = this.buildSearchCondition(key, value, paramKey, alias);

      if (condition) {
        query = query.andWhere(condition.sql, condition.params);
      }
    });

    return query;
  }

  static applyOrderBy<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    orderBy: Record<string, 'ASC' | 'DESC'>,
    alias = 'entity'
  ): SelectQueryBuilder<T> {
    Object.entries(orderBy).forEach(([field, direction]) => {
      query.addOrderBy(`${alias}.${field}`, direction);
    });

    return query;
  }

  static applyPagination<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    page: number,
    limit: number
  ): SelectQueryBuilder<T> {
    const offset = (page - 1) * limit;
    return query.skip(offset).take(limit);
  }

  private static buildCondition(
    key: string,
    value: unknown,
    paramKey: string,
    alias: string
  ): { sql: string; params?: Record<string, unknown>; isNull: boolean } {
    if (value === null || value === undefined) {
      return {
        sql: `${alias}.${key} IS NULL`,
        isNull: true,
      };
    }

    return {
      sql: `${alias}.${key} = :${paramKey}`,
      params: { [paramKey]: value as unknown },
      isNull: false,
    };
  }

  private static buildSearchCondition(
    key: string,
    value: unknown,
    paramKey: string,
    alias: string
  ): { sql: string; params: Record<string, unknown> } | null {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (!trimmedValue) return null;

      return {
        sql: `LOWER(${alias}.${key}) LIKE LOWER(:${paramKey})`,
        params: { [paramKey]: `%${trimmedValue}%` },
      };
    }

    if (typeof value === 'object' && value !== null && 'value' in value) {
      const val = (value as { value: unknown }).value;

      if (typeof val === 'string') {
        const trimmedVal = val.trim();
        if (!trimmedVal) return null;

        return {
          sql: `LOWER(${alias}.${key}) LIKE LOWER(:${paramKey})`,
          params: { [paramKey]: `%${trimmedVal}%` },
        };
      }

      return {
        sql: `${alias}.${key} = :${paramKey}`,
        params: { [paramKey]: val },
      };
    }

    return {
      sql: `${alias}.${key} = :${paramKey}`,
      params: { [paramKey]: value },
    };
  }

  static logQuery<T extends ObjectLiteral>(query: SelectQueryBuilder<T>, context: string): void {
    this.logger.debug(`${context} SQL: ${query.getQuery()}`);
    this.logger.debug(`${context} Parameters: ${JSON.stringify(query.getParameters())}`);
  }
}
