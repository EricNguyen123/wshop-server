import { Repository } from 'typeorm';

export interface TreeNode {
  id: string;
  parentId?: string | null;
  children?: TreeNode[];
  [key: string]: any;
}

export interface TreeFieldConfig {
  idField: string;
  parentIdField: string;
  childrenField: string;
}

export interface TreeBuilderOptions extends Partial<TreeFieldConfig> {
  rootCondition?: (item: any) => boolean;
  sortFn?: (a: any, b: any) => number;
}

export interface CountConfig {
  includeCount: boolean;
  countField: string;
  joinRelation?: string;
  joinField?: string;
}

export interface SearchConfig {
  conditions: Record<string, any>;
  loadAllChildrenOnSearch: boolean;
}

export interface PaginationConfig {
  page: number;
  limit: number;
}

export interface QueryConfig {
  baseWhere: Record<string, any>;
  orderBy: Record<string, 'ASC' | 'DESC'>;
}

export interface PaginatedTreeResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TreeBuilderConfig<T extends import('typeorm').ObjectLiteral = any> {
  repository: Repository<T>;
  fieldConfig: TreeFieldConfig;
  countConfig?: CountConfig;
  queryConfig?: Partial<QueryConfig>;
}

export type TreeProcessorFunction<T> = (items: T[]) => T[];
export type TreeFilterFunction<T> = (item: T) => boolean;
