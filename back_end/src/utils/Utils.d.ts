export declare function delay(t: any): Promise<{}>;
/**
 * 将给定变量转换为数组
 * 1. 变量为数组，返回 变量本身
 * 2. 变量为 null/undefined ,返回空数组
 * 3. 其它，返回数组（有一个元素为变量本身）
 * @param obj
 * @returns {*}
 */
export declare function toArray(obj: any): any[];
export declare function unlinkIfExists(filePath: string): Promise<{}>;
export declare function readFile(filePath: string): Promise<{}>;
export declare function readDir(filePath: string): Promise<any>;
