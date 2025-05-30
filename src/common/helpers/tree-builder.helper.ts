import { Logger } from '@nestjs/common';
import { TreeBuilderOptions, TreeFieldConfig } from 'src/types/tree.types';

export class TreeBuilderService {
  private static readonly logger = new Logger(TreeBuilderService.name, { timestamp: true });

  static buildTree<T extends Record<string, any>>(
    items: T[],
    options: TreeBuilderOptions = {}
  ): T[] {
    const fieldConfig = this.getFieldConfig(options);
    const { rootCondition, sortFn } = options;

    if (!items || items.length === 0) {
      return [];
    }

    this.logger.debug(`Building tree with field config: ${JSON.stringify(fieldConfig)}`);
    this.logger.debug(`Total items to process: ${items.length}`);

    const itemMap = this.createItemMap(items, fieldConfig);
    const rootItems = this.buildHierarchy(items, itemMap, fieldConfig, rootCondition);

    this.logger.debug(`Root items found: ${rootItems.length}`);

    if (sortFn) {
      this.sortTreeRecursively(rootItems, sortFn, fieldConfig.childrenField);
    }

    return rootItems;
  }

  static flattenTree<T extends Record<string, any>>(tree: T[], childrenField = 'children'): T[] {
    const result: T[] = [];

    const traverse = (items: T[]) => {
      items.forEach((item) => {
        const { [childrenField]: children, ...itemWithoutChildren } = item;
        result.push(itemWithoutChildren as T);

        if (Array.isArray(children) && children.length > 0) {
          traverse(children as T[]);
        }
      });
    };

    traverse(tree);
    return result;
  }

  static findInTree<T extends Record<string, any>>(
    tree: T[],
    id: string,
    idField = 'id',
    childrenField = 'children'
  ): T | null {
    for (const item of tree) {
      if (String(item[idField]) === String(id)) {
        return item;
      }

      const children = item[childrenField] as T[];
      if (children && children.length > 0) {
        const found = this.findInTree(children, id, idField, childrenField);
        if (found) return found;
      }
    }

    return null;
  }

  static getParentIds<T extends Record<string, any>>(
    items: T[],
    itemId: string,
    idField = 'id',
    parentIdField = 'parentId'
  ): string[] {
    const itemMap = new Map<string, T>();
    items.forEach((item) => itemMap.set(String(item[idField]), item));

    const parentIds: string[] = [];
    let currentItem = itemMap.get(String(itemId));

    while (currentItem && currentItem[parentIdField]) {
      const parentId = String(currentItem[parentIdField]);
      parentIds.push(parentId);
      currentItem = itemMap.get(parentId);
    }

    return parentIds;
  }

  static getTreeDepth<T extends Record<string, any>>(
    tree: T[],
    childrenField = 'children'
  ): number {
    if (!tree || tree.length === 0) return 0;

    let maxDepth = 1;

    tree.forEach((item) => {
      const children = item[childrenField] as T[];
      if (children && children.length > 0) {
        const childDepth = this.getTreeDepth(children, childrenField) + 1;
        maxDepth = Math.max(maxDepth, childDepth);
      }
    });

    return maxDepth;
  }

  static filterTree<T extends Record<string, any>>(
    tree: T[],
    predicate: (item: T) => boolean,
    childrenField = 'children'
  ): T[] {
    const result: T[] = [];

    tree.forEach((item) => {
      const children = item[childrenField] as T[];
      const filteredChildren =
        children && children.length > 0 ? this.filterTree(children, predicate, childrenField) : [];

      if (predicate(item) || filteredChildren.length > 0) {
        result.push({
          ...item,
          [childrenField]: filteredChildren,
        });
      }
    });

    return result;
  }

  private static getFieldConfig(options: TreeBuilderOptions): TreeFieldConfig {
    return {
      idField: options.idField || 'id',
      parentIdField: options.parentIdField || 'parentId',
      childrenField: options.childrenField || 'children',
    };
  }

  private static createItemMap<T extends Record<string, any>>(
    items: T[],
    fieldConfig: TreeFieldConfig
  ): Map<string, T> {
    const itemMap = new Map<string, T>();

    items.forEach((item) => {
      const itemWithChildren = {
        ...item,
        [fieldConfig.childrenField]: [], // Use the configured children field
      } as T;
      itemMap.set(String(item[fieldConfig.idField]), itemWithChildren);
    });

    this.logger.debug(`Created item map with ${itemMap.size} items`);
    return itemMap;
  }

  private static buildHierarchy<T extends Record<string, any>>(
    items: T[],
    itemMap: Map<string, T>,
    fieldConfig: TreeFieldConfig,
    rootCondition?: (item: any) => boolean
  ): T[] {
    const rootItems: T[] = [];
    const defaultRootCondition = (item: Record<string, any>) =>
      item[fieldConfig.parentIdField] === null ||
      item[fieldConfig.parentIdField] === undefined ||
      item[fieldConfig.parentIdField] === '';

    const isRoot = rootCondition || defaultRootCondition;

    items.forEach((item) => {
      const currentItem = itemMap.get(String(item[fieldConfig.idField]));
      if (!currentItem) {
        this.logger.warn(`Item with id ${item[fieldConfig.idField]} not found in item map`);
        return;
      }

      if (isRoot(item)) {
        rootItems.push(currentItem);
        this.logger.debug(`Added root item: ${item[fieldConfig.idField]}`);
      } else {
        const parentId = String(item[fieldConfig.parentIdField]);
        const parent = itemMap.get(parentId);
        if (parent) {
          // Use the configured children field
          (parent[fieldConfig.childrenField] as T[]).push(currentItem);
          this.logger.debug(`Added child ${item[fieldConfig.idField]} to parent ${parentId}`);
        } else {
          this.logger.warn(
            `Parent with id ${parentId} not found for item ${item[fieldConfig.idField]}`
          );
        }
      }
    });

    return rootItems;
  }

  private static sortTreeRecursively<T>(
    items: T[],
    sortFn: (a: T, b: T) => number,
    childrenField: string
  ): void {
    items.sort(sortFn);
    items.forEach((item) => {
      const children = item[childrenField] as T[];
      if (children && children.length > 0) {
        this.sortTreeRecursively(children, sortFn, childrenField);
      }
    });
  }
}
