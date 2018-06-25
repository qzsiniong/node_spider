
/**
 * 在一个字符串中查找【子字符串】
 * @param string 源字符串
 * @param reg 正则
 * @param {string} deft 默认值
 * @param {number} idx
 * @returns {string}
 */
export const findString = function (string, reg: RegExp, deft: string = '', idx = 1): string {
    const m = reg.exec(string);
    if (m) {
        return m[idx];
    }
    return deft;
};

export function f() {
}
