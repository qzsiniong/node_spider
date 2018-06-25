export async function delay(t) {
  return new Promise(((resolve) => {
    setTimeout(() => resolve(), t);
  }));
}

/**
 * 将给定变量转换为数组
 * 1. 变量为数组，返回 变量本身
 * 2. 变量为 null/undefined ,返回空数组
 * 3. 其它，返回数组（有一个元素为变量本身）
 * @param obj
 * @returns {*}
 */
export function toArray(obj) {
  if (obj === null || obj === undefined) {
    return [];
  }
  if (!Array.isArray(obj)) {
    return [obj];
  }
  return obj;
}

export const _ = 1;
