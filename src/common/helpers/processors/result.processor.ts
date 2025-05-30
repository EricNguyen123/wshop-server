import { CountConfig } from 'src/types/tree.types';

export class ResultProcessor {
  static processRawResults<T extends Record<string, any>>(
    rawResults: Record<string, unknown>[],
    countConfig?: CountConfig,
    entityPrefix = 'entity_'
  ): T[] {
    if (!countConfig?.includeCount) {
      return rawResults as T[];
    }

    return rawResults.map((raw) => {
      const processed: Record<string, unknown> = {};

      Object.keys(raw).forEach((key) => {
        if (key.startsWith(entityPrefix)) {
          const fieldName = key.replace(entityPrefix, '');
          const camelCaseField = this.toCamelCase(fieldName);
          processed[camelCaseField] = raw[key];
        } else if (key === countConfig.countField) {
          processed[countConfig.countField] = parseInt(String(raw[key])) || 0;
        }
      });

      return processed as T;
    });
  }

  static removeDuplicates<T extends Record<string, any>>(items: T[], idField: string): T[] {
    const uniqueMap = new Map<string, T>();

    items.forEach((item) => {
      const id = String(item[idField]);
      if (!uniqueMap.has(id)) {
        uniqueMap.set(id, item);
      }
    });

    return Array.from(uniqueMap.values());
  }

  static mergeResults<T extends Record<string, any>>(...resultArrays: T[][]): T[] {
    return resultArrays.flat();
  }

  static filterValidItems<T extends Record<string, any>>(items: T[], idField: string): T[] {
    return items.filter(
      (item) =>
        item[idField] !== null && item[idField] !== undefined && String(item[idField]).trim() !== ''
    );
  }

  private static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
  }

  static extractIds<T extends Record<string, any>>(items: T[], idField: string): string[] {
    return items.map((item) => String(item[idField])).filter((id) => id && id.trim() !== '');
  }

  static groupByField<T extends Record<string, any>>(
    items: T[],
    groupField: string
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();

    items.forEach((item) => {
      const key = String(item[groupField]);
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });

    return groups;
  }
}
