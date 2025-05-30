import { HttpStatus, NotFoundException } from '@nestjs/common';
import {
  SelectQueryBuilder,
  ObjectLiteral,
  Brackets,
  Like,
  ILike,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  In,
  QueryRunner,
} from 'typeorm';

/**
 * @param entityClass Entity class to query
 * @param entityAlias Alias of entity
 */
export class SimpleSubqueryBuilder<Entity extends ObjectLiteral> {
  private _selectFields: Array<string | { field: string; alias: string }> = ['id'];
  private _conditions: Array<{ sql: string; params?: Record<string, any> }> = [];
  private _relationConfig: { mainAlias: string; foreignKey: string; primaryKey: string } | null =
    null;
  private _selectAs: string = 'subQueryResult';
  private _joins: Array<{
    type: 'inner' | 'left';
    entityClass: new () => any;
    alias: string;
    condition: string;
    params?: Record<string, any>;
  }> = [];
  private _rawSelects: Array<{ expression: string; alias: string }> = [];

  constructor(
    private entityClass: new () => Entity,
    private entityAlias: string = 'm'
  ) {}

  select(fields: Array<string | { field: string; alias: string }>): this {
    this._selectFields = fields;
    return this;
  }

  /**
   * Add a raw select expression
   * @param expression SQL expression
   * @param alias Result alias
   */
  addRawSelect(expression: string, alias: string): this {
    this._rawSelects.push({ expression, alias });
    return this;
  }

  as(alias: string): this {
    this._selectAs = alias;
    return this;
  }

  relatedTo(mainAlias: string, foreignKey: string, primaryKey: string = 'id'): this {
    this._relationConfig = { mainAlias, foreignKey, primaryKey };
    return this;
  }

  where(condition: string, params?: Record<string, any>): this {
    this._conditions.push({ sql: condition, params });
    return this;
  }

  /**
   * Add an inner join to the query
   * @param entityClass Entity class to join
   * @param alias Alias for the joined entity
   * @param condition Join condition
   * @param params Parameters for the condition
   */
  innerJoin(
    entityClass: new () => any,
    alias: string,
    condition: string,
    params?: Record<string, any>
  ): this {
    this._joins.push({
      type: 'inner',
      entityClass,
      alias,
      condition,
      params,
    });
    return this;
  }

  /**
   * Add a left join to the query
   * @param entityClass Entity class to join
   * @param alias Alias for the joined entity
   * @param condition Join condition
   * @param params Parameters for the condition
   */
  leftJoin(
    entityClass: new () => any,
    alias: string,
    condition: string,
    params?: Record<string, any>
  ): this {
    this._joins.push({
      type: 'left',
      entityClass,
      alias,
      condition,
      params,
    });
    return this;
  }

  build<T extends ObjectLiteral>() {
    const entityAlias = this.entityAlias;
    const selectFields = this._selectFields;
    const conditions = this._conditions;
    const relationConfig = this._relationConfig;
    const entityClass = this.entityClass;
    const joins = this._joins;
    const rawSelects = this._rawSelects;

    return (qb: SelectQueryBuilder<T>) => {
      const jsonFieldsArray = selectFields.map((field) => {
        if (typeof field === 'string') {
          return `'${field}', ${entityAlias}.${field}`;
        } else {
          return `'${field.alias}', ${field.field}`;
        }
      });

      rawSelects.forEach(({ expression, alias }) => {
        jsonFieldsArray.push(`'${alias}', ${expression}`);
      });

      const jsonFieldsStr = jsonFieldsArray.join(', ');

      let subQuery = qb
        .subQuery()
        .select(`JSON_ARRAYAGG(JSON_OBJECT(${jsonFieldsStr}))`)
        .from(entityClass, entityAlias);

      joins.forEach((join) => {
        if (join.type === 'inner') {
          if (join.params) {
            subQuery = subQuery.innerJoin(
              join.entityClass,
              join.alias,
              join.condition,
              join.params
            );
          } else {
            subQuery = subQuery.innerJoin(join.entityClass, join.alias, join.condition);
          }
        } else if (join.type === 'left') {
          if (join.params) {
            subQuery = subQuery.leftJoin(join.entityClass, join.alias, join.condition, join.params);
          } else {
            subQuery = subQuery.leftJoin(join.entityClass, join.alias, join.condition);
          }
        }
      });

      if (relationConfig) {
        subQuery = subQuery.where(
          `${entityAlias}.${relationConfig.foreignKey} = ${relationConfig.mainAlias}.${relationConfig.primaryKey}`
        );
      }

      conditions.forEach(({ sql, params }) => {
        if (params) {
          subQuery = subQuery.andWhere(sql, params);
        } else {
          subQuery = subQuery.andWhere(sql);
        }
      });

      return subQuery;
    };
  }

  get result() {
    return {
      subQueryFn: this.build(),
      alias: this._selectAs,
    };
  }
}

/**
 * @param entityClass Entity class to query
 * @param entityAlias Alias of entity
 */
export function createSubquery<Entity extends ObjectLiteral>(
  entityClass: new () => Entity,
  entityAlias: string = 'm'
) {
  return new SimpleSubqueryBuilder<Entity>(entityClass, entityAlias);
}

export function addAdvancedSearch<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  searchValue: string | undefined | null,
  searchConfigs: Array<{
    field: string;
    alias?: string;
    caseSensitive?: boolean;
    exactMatch?: boolean;
    transform?: (value: string) => string;
  }>
): SelectQueryBuilder<T> {
  const processedValue = searchValue?.trim();

  if (!processedValue) {
    return queryBuilder;
  }

  queryBuilder.andWhere(
    new Brackets((qb) => {
      searchConfigs.forEach((config, index) => {
        const { field, alias, caseSensitive = false, exactMatch = false, transform } = config;

        let searchTerm = processedValue;
        if (transform) {
          searchTerm = transform(searchTerm);
        }

        const operator = caseSensitive ? Like : ILike;
        const searchPattern = exactMatch ? searchTerm : `%${searchTerm}%`;

        const fieldName = alias ? `${alias}.${field}` : field;
        const condition = { [fieldName]: operator(searchPattern) };

        if (index === 0) {
          qb.where(condition);
        } else {
          qb.orWhere(condition);
        }
      });
    })
  );

  return queryBuilder;
}

export interface FindByIdsOptions<T> {
  relations?: string[];
  select?: (keyof T)[];
  throwOnMissing?: boolean;
  customError?: {
    status: HttpStatus;
    message: string;
    code: string | number;
  };
}

export async function findEntitiesByIds<T extends ObjectLiteral>(
  manager: EntityManager,
  entityClass: EntityTarget<T>,
  ids: any[],
  options?: FindByIdsOptions<T>
): Promise<T[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  const findOptions: FindManyOptions<T> = {
    where: { id: In(ids) } as Partial<Record<keyof T, any>>,
  };

  if (options?.relations) {
    findOptions.relations = options.relations;
  }

  if (options?.select) {
    findOptions.select = options.select;
  }

  const entities = await manager.find(entityClass, findOptions);

  if (options?.throwOnMissing && entities.length !== ids.length) {
    const foundIds = entities.map((entity: T & { id: unknown }) => entity.id);
    const missingIds = ids.filter((id) => !foundIds.includes(id));

    if (options.customError) {
      throw new NotFoundException(options.customError);
    } else {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: `Entities not found with IDs: ${missingIds.join(', ')}`,
        code: 'ENTITIES_NOT_FOUND',
      });
    }
  }

  return entities;
}

export async function findEntitiesByIdsWithQueryRunner<T extends ObjectLiteral>(
  queryRunner: QueryRunner,
  entityClass: EntityTarget<T>,
  ids: any[],
  options?: FindByIdsOptions<T>
): Promise<T[]> {
  return findEntitiesByIds(queryRunner.manager, entityClass, ids, options);
}

export async function validateAndAssignEntities<
  T extends ObjectLiteral,
  K extends ObjectLiteral,
  P extends keyof T,
>(
  manager: EntityManager | QueryRunner,
  entityClass: EntityTarget<K>,
  ids: any[],
  targetEntity: T,
  relationshipProperty: P,
  errorConfig?: {
    status: HttpStatus;
    message: string;
    code: string | number;
  }
): Promise<void> {
  if (!ids || ids.length === 0) {
    return;
  }

  function isQueryRunner(obj: unknown): obj is QueryRunner {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'manager' in obj &&
      typeof (obj as { manager?: unknown }).manager === 'object' &&
      (obj as { manager?: unknown }).manager !== null
    );
  }

  const actualManager = isQueryRunner(manager) ? manager.manager : manager;

  const entities = await findEntitiesByIds(actualManager, entityClass, ids, {
    throwOnMissing: true,
    customError: errorConfig,
  });

  (targetEntity[relationshipProperty] as unknown as K[]) = entities;
}

export async function validateMultipleRelationships(
  manager: EntityManager | QueryRunner,
  validations: Array<{
    entityClass: EntityTarget<any>;
    ids: any[];
    errorConfig?: {
      status: HttpStatus;
      message: string;
      code: string;
    };
  }>
): Promise<Record<string, any[]>> {
  const results: Record<string, any[]> = {};

  function isQueryRunner(obj: unknown): obj is QueryRunner {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'manager' in obj &&
      typeof (obj as { manager?: unknown }).manager === 'object' &&
      (obj as { manager?: unknown }).manager !== null
    );
  }

  for (let i = 0; i < validations.length; i++) {
    const validation = validations[i];
    const entityName =
      typeof validation.entityClass === 'function' && 'name' in validation.entityClass
        ? (validation.entityClass as { name: string }).name
        : typeof validation.entityClass === 'object' &&
            validation.entityClass !== null &&
            'name' in validation.entityClass
          ? (validation.entityClass as { name: string }).name
          : JSON.stringify(validation.entityClass);

    const actualManager = isQueryRunner(manager) ? manager.manager : manager;

    results[entityName] = await findEntitiesByIds(
      actualManager,
      validation.entityClass,
      validation.ids,
      {
        throwOnMissing: true,
        customError: validation.errorConfig,
      }
    );
  }

  return results;
}
