// import esImport from 'node-dynamic-import';
// import { CronJob } from 'cron';

import Enums from './Enums';
import BaseSpider from '../BaseSpider';
import { findString } from '../utils/StringUtils';
import { getAppLogger } from '../utils/LoggerUtils';
import Config from "../../config/default";

const appLogger = getAppLogger();

function getSpiderName(spiderFilename) {
  return spiderFilename.replace(/(-\d+)?\.(js|ts)/, '');
}


export default async function loadSpider(spiderFilename, spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll) {
  const spiderName = getSpiderName(spiderFilename);
  const oldSpider = spiderMap[spiderName];
  const version = parseInt(findString(spiderFilename, /-(\d+)\.(js|ts)/, '-1'), 10);
  const { default: Spider } = await import(`${Config.spidersPath}${spiderFilename}`);

  // Spider must extends BaseSpider
  if (Object.getPrototypeOf(Spider) !== BaseSpider) {
    appLogger.error(`Spider in file[${spiderFilename}] must extends BaseSpider`);
    return;
  }

  // Spider class name must equal with filename
  if (Spider.name !== spiderName) {
    appLogger.error(`Spider in file[${spiderFilename}] must named ${spiderName}`);
    return;
  }

  if (oldSpider) {
    await oldSpider.setStatus(Enums.spiderStatus.todo);
  }

  // createCronJob
  const spider = new Spider({
    timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, version,
  });

  await spider.initSpider();
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
}
