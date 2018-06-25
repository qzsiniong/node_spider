import fs = require("fs");
import {findString} from "./StringUtils";
import loadSpider from "../spider/loadSpider";
import Config from "../../config/default";

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

export async function unlinkIfExists(filePath: string) {
    return new Promise(((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                resolve();
                return;
            }

            fs.unlink(filePath, (err1) => {
                if (err1) throw err1;
                resolve();
            });
        });
    }));
}

export async function readFile(filePath: string) {
    return new Promise(((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) throw err;

            resolve(data);
        });
    }));
}


export async function readDir(filePath: string): Promise<any> {
    return new Promise(((resolve, reject) => {
        fs.readdir(filePath, (err, fileNames: string[]) => {
            if (err) throw err;

            resolve(fileNames);
        });
    }));
}
