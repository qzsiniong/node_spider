import {Get, Res, RestController, Inject, QueryParam, Req, Post, PathParam} from "loon";
import { CronJob } from 'cron';
import * as Express from 'express';

@RestController("/api/spiderInfos")
export class SpiderInfoController {

    @Get("")
    public async getSpidersInfo(@Res() res: Express.Response) {
        const {
            spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
        } = global['app'];
        const infos = {};

        Object.keys(spiderMap).forEach((spiderName) => {
            const spider = spiderMap[spiderName];
            const counter = {};
            const info = {
                counter,
                nextCronDates: null,
                queueSize: spider.crawler.queueSize,
            };
            infos[spiderName] = info;


            if (spider.cronJob) {
                info.nextCronDates = spider.cronJob.nextDates(30).map(d => d.format('X'));
            }

            counter['5m'] = {
                newly: timeBucket5m.get(`${spiderName}_newly`),
                success: timeBucket5m.get(`${spiderName}_success`),
                failed: timeBucket5m.get(`${spiderName}_failed`),
                retry: timeBucket5m.get(`${spiderName}_retry`),
            };
            counter['1h'] = {
                newly: timeBucket1h.get(`${spiderName}_newly`),
                success: timeBucket1h.get(`${spiderName}_success`),
                failed: timeBucket1h.get(`${spiderName}_failed`),
                retry: timeBucket1h.get(`${spiderName}_retry`),
            };
            counter['1d'] = {
                newly: timeBucket1d.get(`${spiderName}_newly`),
                success: timeBucket1d.get(`${spiderName}_success`),
                failed: timeBucket1d.get(`${spiderName}_failed`),
                retry: timeBucket1d.get(`${spiderName}_retry`),
            };
            counter['all'] = {
                newly: timeBucketAll.get(`${spiderName}_newly`),
                success: timeBucketAll.get(`${spiderName}_success`),
                failed: timeBucketAll.get(`${spiderName}_failed`),
                retry: timeBucketAll.get(`${spiderName}_retry`),
            };
        });

        res.json(infos);
    }

}
