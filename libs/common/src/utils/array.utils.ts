export class ArrayUtils {
  /**
   * Get difference from two array
   * @param a1 any[]
   * @param a2 any[]
   * @returns any[] Difference member of a1 vs a2
   */
  public static arrDifferenceElements<T>(a1: T[] = [], a2: T[] = []): T[] {
    const a2Set = new Set(a2);
    return a1.filter(function (x) {
      return !a2Set.has(x);
    });
  }

  /**
   * Check is array
   * @param elements  Any[]
   * @returns Is array
   */
  public static isArray = function (elements: unknown[]): boolean {
    return !!elements && elements.constructor === Array;
  };

  /**
   * Check is number array sorted
   * @param elements  Number[]
   * @returns Is number array sorted
   */
  public static isArraySorted(elements: number[]): boolean {
    let isSorted = true;
    for (let i = 0; i < elements.length - 1; i++) {
      if (elements[i] > elements[i + 1]) {
        isSorted = false;
        break;
      }
    }
    return isSorted;
  }

  public static isStringArray(arr: any): arr is string[] {
    return ArrayUtils.isArray(arr) && arr.every(item => typeof item === 'string');
  }

  /**
   * Check if 2 arrays have the same elements
   * @param a any[]
   * @param b any[]
   * @returns bool  true if 2 arrays have the same elements
   */
  public static arraysEqual(a: unknown[], b: unknown[]): boolean {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(val => b.includes(val));
  }

  public static arrayUnique(arr: any[]): any[] {
    return arr.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  public static convertArrayToObject(array, key): any {
    const initialValue = {};
    return array.reduce((obj, item) => {
      return {
        ...obj,
        [item[key]]: item,
      };
    }, initialValue);
  }

  public static convertArrayToMap<T, K extends keyof T>(array: T[], key: K): Map<T[K], T> {
    return array.reduce((map, item) => {
      const mapKey = item[key];

      if (!mapKey) {
        throw new Error(`Missing key for ${item.constructor.name} map`);
      }

      map.set(mapKey, item);
      return map;
    }, new Map());
  }

  public static convertArrayToRecord<T>(array: T[], key: string): Record<string, T> {
    return array.reduce((record, item) => {
      const recordKey = item[key];
      record[recordKey] = item;
      return record;
    }, {});
  }

  public static convertArrayToArrayRecord<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((record, item) => {
      const recordKey = item[key];

      let existedRecordItem = record[recordKey];
      if (!existedRecordItem) {
        existedRecordItem = [item];
      } else {
        existedRecordItem.push(item);
      }

      record[recordKey] = existedRecordItem;
      return record;
    }, {});
  }

  public static groupByArrayOfObjects<T>(array: T[], groupBy: keyof T): Map<string, T[]> {
    const map = new Map();
    array.forEach(item => {
      const key = item[groupBy];
      const value = map.get(key);
      if (!value) {
        map.set(key, [item]);
      } else {
        value.push(item);
      }
    });
    return map;
  }

  public static removeItem<T>(arr: Array<T>, value: T): Array<T> {
    const index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }
}
