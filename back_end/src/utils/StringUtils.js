"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 在一个字符串中查找【子字符串】
 * @param string 源字符串
 * @param reg 正则
 * @param {string} deft 默认值
 * @param {number} idx
 * @returns {string}
 */
exports.findString = function (string, reg, deft = '', idx = 1) {
    const m = reg.exec(string);
    if (m) {
        return m[idx];
    }
    return deft;
};
function f() {
}
exports.f = f;
//# sourceMappingURL=StringUtils.js.map