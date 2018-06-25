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
// import esImport from 'node-dynamic-import';
const fs = require("fs");
const path = require("path");
const CounterByTime_1 = require("../utils/CounterByTime");
const StringUtils_1 = require("../utils/StringUtils");
const loadSpider_1 = require("./loadSpider");
const LoggerUtils_1 = require("../utils/LoggerUtils");
const default_1 = require("../../config/default");
const appLogger = LoggerUtils_1.getAppLogger();
const reloadConfig = () => __awaiter(this, void 0, void 0, function* () {
    appLogger.info('@@@@@@@ reloadConfig  @@@@@@@');
    const spiderMap = {};
    const timeBucket5m = yield CounterByTime_1.default.newInstance(5 * 60 * 1000, 5 * 1000, path.resolve(__dirname, '../../data/timeBucket.5m.json'));
    const timeBucket1h = yield CounterByTime_1.default.newInstance(60 * 60 * 1000, 60 * 1000, path.resolve(__dirname, '../../data/timeBucket.1h.json'));
    const timeBucket1d = yield CounterByTime_1.default.newInstance(24 * 60 * 60 * 1000, 30 * 60 * 1000, path.resolve(__dirname, '../../data/timeBucket.1d.json'));
    const timeBucketAll = yield CounterByTime_1.default.newInstance(10 * 365 * 24 * 60 * 60 * 1000, 10 * 365 * 24 * 60 * 60 * 1000, path.resolve(__dirname, '../../data/timeBucket.all.json'));
    fs.readdir(`${default_1.default.spidersPath}`, (err, fileNames) => {
        const spiderFileMap = {};
        fileNames.filter((file) => {
            if (file.startsWith('-')) {
                return false;
            }
            if (!file.endsWith('.js')) {
                return false;
            }
            return true;
        }).forEach((file) => {
            const versionNumber = parseInt(StringUtils_1.findString(file, /-(\d+)\.js/, '-1'), 10);
            const spiderName = file.replace(/(-\d+)?\.js/, '');
            const versionNumbers = spiderFileMap[spiderName] || [];
            versionNumbers.push(versionNumber);
            spiderFileMap[spiderName] = versionNumbers.sort((a, b) => b - a);
        });
        const files = [];
        for (const spiderFilename of Object.keys(spiderFileMap)) {
            const versionNumbber = spiderFileMap[spiderFilename][0];
            if (versionNumbber < 0) {
                files.push(`${spiderFilename}.js`);
            }
            else {
                files.push(`${spiderFilename}-${versionNumbber}.js`);
            }
        }
        if (files && files.length) {
            files.forEach((spiderFilename) => __awaiter(this, void 0, void 0, function* () {
                // skip spider which filename starts with "-"
                if (spiderFilename.startsWith('-')) {
                    return;
                }
                yield loadSpider_1.default(spiderFilename, spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll);
            }));
        }
    });
    return {
        spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
    };
});
exports.default = reloadConfig;
//# sourceMappingURL=reloadConfig.js.map