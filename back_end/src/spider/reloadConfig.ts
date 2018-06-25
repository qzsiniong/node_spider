// import esImport from 'node-dynamic-import';
import fs = require("fs");
import path = require("path");
import TimeBucket from '../utils/CounterByTime';

import {findString} from '../utils/StringUtils';

import loadSpider from './loadSpider';
import {getAppLogger} from '../utils/LoggerUtils';
import Config from "../../config/default";

const appLogger = getAppLogger();


const reloadConfig = async () => {
    appLogger.info('@@@@@@@ reloadConfig  @@@@@@@');

    const spiderMap = {};
    const timeBucket5m = await TimeBucket.newInstance(5 * 60 * 1000, 5 * 1000, path.resolve(__dirname, '../../data/timeBucket.5m.json'));
    const timeBucket1h = await TimeBucket.newInstance(60 * 60 * 1000, 60 * 1000, path.resolve(__dirname, '../../data/timeBucket.1h.json'));
    const timeBucket1d = await TimeBucket.newInstance(24 * 60 * 60 * 1000, 30 * 60 * 1000, path.resolve(__dirname, '../../data/timeBucket.1d.json'));
    const timeBucketAll = await TimeBucket.newInstance(10 * 365 * 24 * 60 * 60 * 1000, 10 * 365 * 24 * 60 * 60 * 1000, path.resolve(__dirname, '../../data/timeBucket.all.json'));


    fs.readdir(`${Config.spidersPath}`, (err, fileNames) => {
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
            const versionNumber = parseInt(findString(file, /-(\d+)\.js/, '-1'), 10);
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
            } else {
                files.push(`${spiderFilename}-${versionNumbber}.js`);
            }
        }

        if (files && files.length) {
            files.forEach(async (spiderFilename) => {
                // skip spider which filename starts with "-"
                if (spiderFilename.startsWith('-')) {
                    return;
                }
                await loadSpider(spiderFilename, spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll);
            });
        }
    });
    return {
        spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
    };
};

export default reloadConfig;
