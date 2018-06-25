"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
function delay(t) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(((resolve) => {
            setTimeout(() => resolve(), t);
        }));
    });
}
exports.delay = delay;
/**
 * 将给定变量转换为数组
 * 1. 变量为数组，返回 变量本身
 * 2. 变量为 null/undefined ,返回空数组
 * 3. 其它，返回数组（有一个元素为变量本身）
 * @param obj
 * @returns {*}
 */
function toArray(obj) {
    if (obj === null || obj === undefined) {
        return [];
    }
    if (!Array.isArray(obj)) {
        return [obj];
    }
    return obj;
}
exports.toArray = toArray;
function unlinkIfExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(((resolve) => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    resolve();
                    return;
                }
                fs.unlink(filePath, (err1) => {
                    if (err1)
                        throw err1;
                    resolve();
                });
            });
        }));
    });
}
exports.unlinkIfExists = unlinkIfExists;
function readFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err)
                    throw err;
                resolve(data);
            });
        }));
    });
}
exports.readFile = readFile;
function readDir(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(((resolve, reject) => {
            fs.readdir(filePath, (err, fileNames) => {
                if (err)
                    throw err;
                resolve(fileNames);
            });
        }));
    });
}
exports.readDir = readDir;
//# sourceMappingURL=Utils.js.map