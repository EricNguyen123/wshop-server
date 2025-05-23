import { SelectQueryBuilder, ObjectLiteral, Brackets, Like, ILike } from 'typeorm';

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
