"use strict";
// import esImport from 'node-dynamic-import';
// import { CronJob } from 'cron';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Enums_1 = require("./Enums");
const BaseSpider_1 = require("../BaseSpider");
const StringUtils_1 = require("../utils/StringUtils");
const LoggerUtils_1 = require("../utils/LoggerUtils");
const default_1 = require("../../config/default");
const appLogger = LoggerUtils_1.getAppLogger();
function getSpiderName(spiderFilename) {
    return spiderFilename.replace(/(-\d+)?\.(js|ts)/, '');
}
function loadSpider(spiderFilename, spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll) {
    return __awaiter(this, void 0, void 0, function* () {
        const spiderName = getSpiderName(spiderFilename);
        const oldSpider = spiderMap[spiderName];
        const version = parseInt(StringUtils_1.findString(spiderFilename, /-(\d+)\.(js|ts)/, '-1'), 10);
        const { default: Spider } = yield Promise.resolve().then(() => require(`${default_1.default.spidersPath}${spiderFilename}`));
        // Spider must extends BaseSpider
        if (Object.getPrototypeOf(Spider) !== BaseSpider_1.default) {
            appLogger.error(`Spider in file[${spiderFilename}] must extends BaseSpider`);
            return;
        }
        // Spider class name must equal with filename
        if (Spider.name !== spiderName) {
            appLogger.error(`Spider in file[${spiderFilename}] must named ${spiderName}`);
            return;
        }
        if (oldSpider) {
            yield oldSpider.setStatus(Enums_1.default.spiderStatus.todo);
        }
        // createCronJob
        const spider = new Spider({
            timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, version,
        });
        yield spider.initSpider();
        Object.assign(spiderMap, { [spiderName]: spider });
        // Spider must has cronTime
        const { cronTime } = spider;
        if (cronTime === null || cronTime === '') {
            appLogger.warn(`Spider[${spiderName}] has no cronTime`);
            return;
        }
        spider.startCron();
        // const cronJob = new CronJob({
        //   cronTime: _crontime,
        //   onTick: async () => {
        //     try {
        //       const status = spider.getStatus();
        //       if (status === Enums.spiderStatus.running) {
        //         await (async () => spider.callStart())();
        //       } else {
        //         appLogger.warn(`${spiderName}'s status is ${status}(not 'running'), so not start it in it's cron.`);
        //       }
        //     } catch (e) {
        //       if (e.code === Spider.START_FUNCTION_NOT_IMPLEMENTS) {
        //         appLogger.error(`Spider[${spiderName}] not implements start function`);
        //       } else {
        //         appLogger.error(e);
        //       }
        //     }
        //   },
        //   onComplete: () => {
        //     /* This function is executed when the job stops */
        //     appLogger.info(`spider cron [${spiderName}] stopped;`);
        //   },
        //   start: false,
        //   timeZone: 'Asia/Shanghai',
        // });
        // cronJob.start();
        // spider.cronJob = cronJob;
        // appLogger.info(`start a cron[${_crontime}] job for spider[${spiderName}]`);
    });
}
exports.default = loadSpider;
//# sourceMappingURL=loadSpider.js.map