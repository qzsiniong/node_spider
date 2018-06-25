/**
 * Spider
 */
import * as md5 from 'md5';
import * as timeLen from 'time-len';
import * as cheerio from 'cheerio';
import {CronJob} from 'cron';

import dataUriToBuffer = require("data-uri-to-buffer");

import createCrawler from './spider/createCrawler';
import Enums from './spider/Enums';
import RetryImmediatelyError from './spider/errors/RetryImmediatelyError';
import FailedError from './spider/errors/FailedError';
import {getAppLogger, getSpiderLogger} from './utils/LoggerUtils';
import Config from "../config/default";
import {delay} from "./utils/Utils";
import DB from './spider/database/DB';
import SpiderDB from "./spider/database/SpiderDB";
import TaskDB from "./spider/database/TaskDB";

const appLogger = getAppLogger();

const getCallbackFunctionName = (callback) => {
    if (typeof callback === 'string') {
        return callback;
    }
    return callback.callbackFunctionName || callback.name;
};


abstract class BaseSpider {
    protected readonly logger;
    protected readonly cheerio = cheerio;

    // private readonly seenReq;
    private readonly spiderName;
    private readonly tableName;
    private readonly version;
    private status;
    private groups;
    private rate;

    private readonly timeBucket5m;
    private readonly timeBucket1h;
    private readonly timeBucket1d;
    private readonly timeBucketAll;

    private isInitSpider;
    private cronTime;
    private crawler;
    private cronJob;

    protected constructor({
                              timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, version,
                          }) {
        // this.seenReq = new SeenReq({
        // });
        this.logger = getSpiderLogger(this.getSpiderName());
        this.spiderName = this.getSpiderName();
        this.tableName = this.getSpiderTableName();
        this.status = null;
        this.groups = null;
        this.rate = null;

        this.version = version;

        this.timeBucket5m = timeBucket5m;
        this.timeBucket1h = timeBucket1h;
        this.timeBucket1d = timeBucket1d;
        this.timeBucketAll = timeBucketAll;
    }

    /**
     * 默认过期时间 单位【秒】
     * @type {number|string}
     */
    protected defaultAge: number | string = -1;
    /**
     * 默认优先级，0-10，数值越小优先级越高
     * @type {number}
     */
    protected defaultPriority: Priority = Priority._5();

    protected async DefaultPreRequest(options, done) {
        done();
    }

    protected md5(message: string | Buffer): string {
        return md5(message);
    }

    // ┌────────────── Seconds: 0-59
    // │ ┌──────────── Minutes: 0-59
    // │ │ ┌────────── Hours: 0-23
    // │ │ │ ┌──────── Day of Month: 1-31
    // │ │ │ │ ┌────── Months: 0-11
    // │ │ │ │ │ ┌──── Day of Week: 0-6
    // │ │ │ │ │ │
    // │ │ │ │ │ │
    // * * * * * *
    //
    // ┌──────────── Minutes: 0-59
    // │ ┌────────── Hours: 0-23
    // │ │ ┌──────── Day of Month: 1-31
    // │ │ │ ┌────── Months: 0-11
    // │ │ │ │ ┌──── Day of Week: 0-6
    // │ │ │ │ │
    // │ │ │ │ │
    // * * * * *
    //
    // Date
    // cronTime = new Date(new Date().getTime() + 5000);

    private async initSpider() {
        if (this.isInitSpider) {
            return;
        }
        this.isInitSpider = true;
        await DB.taskQuery(`
CREATE TABLE IF NOT EXISTS \`${this.tableName}\`
(
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  pretaskid     CHAR(36)      NULL,
  uri           VARCHAR(1024) NULL,
  status        INT(1)        NULL,
  tags          VARCHAR(100)  NULL,
  options       BLOB          NULL,
  \`fetch\`     BLOB          NULL,
  process       BLOB          NULL,
  track         BLOB          NULL,
  body          MEDIUMTEXT    NULL,
  scheduletime  DOUBLE(16,4)  NULL,
  lastcrawltime DOUBLE(16,4)  NULL,
  updatetime    DOUBLE(16,4)  NULL,
  INDEX \`status_index\` (\`status\`),
  INDEX \`pretaskid_index\` (\`pretaskid\`)
) ENGINE=InnoDB CHARSET=utf8
    `);

        let spider = await SpiderDB.getSpider(this.spiderName);
        if (spider === null) {
            await SpiderDB.insertSpider({name: this.spiderName});
            spider = await SpiderDB.getSpider(this.spiderName);
        }

        this.status = spider.status;
        this.groups = spider.groups;
        this.rate = spider.rate;
        this.cronTime = spider.crontime;

        await this.initCrawler();
        await this.setStatus(spider.status);
    }

    protected async dataQuery(sql: string, values?: any) {
        return DB.dataQuery(sql, values);
    }

    private getStatus() {
        return this.status;
    }

    private async setStatus(status) {
        if (this.status === status) {
            return;
        }

        if (status === Enums.spiderStatus.running) {
            while (this.crawler.queueSize) {
                // console.log(`waiting for a moment ,queueSize=${this.crawler.queueSize}`);
                await delay(1000);
            }
            // console.log(`queueSize may be zero, ${this.crawler.queueSize}, now loadTasks...`);
            this.status = status;
            await this.loadTasks();
        } else {
            this.status = status;
            while (this.crawler.limiters.limiters.default._waitingClients.dequeue()) ;
        }
        await SpiderDB.updateSpider({name: this.spiderName, status});
    }

    private async setRate(rate) {
        if (this.rate === rate) {
            return;
        }
        this.rate = rate;
        await SpiderDB.updateSpider({name: this.spiderName, rate});
        this.crawler.setLimiterProperty('default', 'rateLimit', rate);
    }

    private async setCronTime(cronTime) {
        if (this.cronTime === cronTime) {
            return;
        }
        this.cronTime = cronTime;
        await SpiderDB.updateSpider({name: this.spiderName, cronTime});
        this.stopCron();

        if (cronTime !== null) {
            this.startCron();
        }
    }

    private getSpiderName() {
        return this.constructor.name;
    }

    private getSpiderTableName() {
        const spiderName = this.getSpiderName();
        return spiderName.replace(/[A-Z]/g, (s, i) => (i === 0 ? '' : '_') + s.toLowerCase());
    }

    private startCron() {
        const {cronTime, spiderName} = this;
        let {cronJob} = this;
        if (cronJob && cronJob.running) {
            throw new Error('spider\'s cronJob is running, no need restart.');
        }
        if (!cronJob) {
            cronJob = new CronJob({
                cronTime,
                onTick: async () => {
                    try {
                        const status = this.getStatus();
                        if (status === Enums.spiderStatus.running) {
                            await this.callStart();
                        } else {
                            appLogger.warn(`${spiderName}'s status is ${status}(not 'running'), so not start it in it's cron.`);
                        }
                    } catch (e) {
                        appLogger.error(e);
                    }
                },
                onComplete: () => {
                    /* This function is executed when the job stops */
                    appLogger.info(`spider cron [${spiderName}] stopped;`);
                },
                start: false,
                timeZone: 'Asia/Shanghai',
            });
            this.cronJob = cronJob;
        }
        cronJob.start();
        appLogger.info(`start a cron[${cronTime}] job for spider[${spiderName}]`);
    }

    private stopCron() {
        const {cronJob} = this;
        if (cronJob && cronJob.running) {
            cronJob.stop();
            this.cronJob = null;
        }
    }

    private async storeData(data: Data[]) {
        for (const item of data) {
            const {$table: table, ...d} = item;
            const serviceName = table.toLowerCase().replace(/(^|_)\w/g, (s) => s.substr(-1).toUpperCase()) + 'Service';

            try {
                const {default: Service} = await import(`${Config.servicesPath}${serviceName}`);
                const service = new Service();

                if (typeof service.save === 'function') {
                    await service.save(d);
                } else {
                    throw new Error(`${Config.servicesPath}${serviceName}.save is not a function`);
                }

            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {

                    const [{count}] = await this.dataQuery(`SELECT COUNT(1) count FROM ${DB.mysql.escapeId(table)} WHERE id = ?`, d.id);

                    if (count > 0) {
                        const {id, ...dd} = d;
                        dd.update_at = new Date();
                        await this.dataQuery(`UPDATE ${DB.mysql.escapeId(table)} SET ? WHERE id = ?`, [dd, id]);
                    } else {
                        await this.dataQuery(`INSERT INTO ${DB.mysql.escapeId(table)} SET ?`, d);
                    }
                } else {
                    appLogger.error(e);
                    throw e;
                }
            }
        }
    }

    private wrapCallback(callbackFunctionName, taskId) {
        let cbFunName = callbackFunctionName;
        if (this[cbFunName] === undefined) {
            this.logger.error(`${this.spiderName}.${cbFunName} 不存在`);
            cbFunName = 'cbDefault';
        }
        if (typeof this[cbFunName] !== 'function') {
            this.logger.error(`${this.spiderName}.${cbFunName} 不是function`);
            cbFunName = 'cbDefault';
        }
        const callbackFunction = this[cbFunName].bind(this);
        return async (error, res, done) => {
            const {taskInfo} = res.options;
            const now = new Date().getTime();
            const processStartTime = now;
            const task = {
                id: taskId,
                lastcrawltime: (new Date()).getTime() / 1000,
                track: {
                    request: res.request,
                    fetch: {
                        headers: res.headers,
                        status_code: res.statusCode,
                        time: now - taskInfo.crawlStartTime,
                    },
                    process: {
                        data: [],
                        follows: [],
                        exception: null,
                        time: null,
                    },
                },
                status: null,
                body: null,
            };
            if (error) {
                task.status = Enums.taskStatus.failed;
            } else {
                try {
                    task.body = res.body;
                    const result = new Result();

                    if (callbackFunctionName === this.start.name) {
                        await callbackFunction(result);
                    } else {
                        await callbackFunction(res, res.options.saves || {}, result);
                    }

                    const {follows, data} = result;

                    const followIds = [];
                    /* eslint-disable no-await-in-loop,no-restricted-syntax */
                    for (const follow of follows) {
                        follow.preTaskId = taskId;
                        const followTaskId = await this.crawl(follow);
                        if (followTaskId) {
                            followIds.push(followTaskId);
                        }
                    }
                    /* eslint-enable no-await-in-loop,no-restricted-syntax */
                    task.track.process.follows = followIds;
                    task.track.process.data = data;

                    await this.storeData(data);

                    task.status = Enums.taskStatus.success;
                    await this.timeBucket5m.put(`${this.spiderName}_success`, 1);
                    await this.timeBucket1h.put(`${this.spiderName}_success`, 1);
                    await this.timeBucket1d.put(`${this.spiderName}_success`, 1);
                    await this.timeBucketAll.put(`${this.spiderName}_success`, 1);
                } catch (e) { // callback 中 出错
                    const {options} = res;
                    const uri = options.uri || options.url;

                    if (e instanceof RetryImmediatelyError) {
                        // 立即重试一次
                        this.logger.debug(`retry immediately ${uri}`);
                        await this.retryImmediately(options);
                        // await this.timeBucket5m.put(`${this.spiderName}retry`, 1);
                        // await this.timeBucket1h.put(`${this.spiderName}retry`, 1);
                        // await this.timeBucket1d.put(`${this.spiderName}retry`, 1);
                        // await this.timeBucketAll.put(`${this.spiderName}retry`, 1);
                        done();
                        return;
                    }

                    const str = options.retries ? ` (${options.retries} retries left)` : '';
                    this.logger.error(`Error ${e} when processing ${uri} in callback[${this.getSpiderName()}.${cbFunName}] ${str}`);
                    this.logger.error(e);
                    task.track.process.exception = e.stack;
                    if (options.retries && !(e instanceof FailedError)) {
                        await this.retry(options);
                        task.status = Enums.taskStatus.bad;
                        await this.timeBucket5m.put(`${this.spiderName}retry`, 1);
                        await this.timeBucket1h.put(`${this.spiderName}retry`, 1);
                        await this.timeBucket1d.put(`${this.spiderName}retry`, 1);
                        await this.timeBucketAll.put(`${this.spiderName}retry`, 1);
                    } else {
                        task.status = Enums.taskStatus.failed;
                        await this.timeBucket5m.put(`${this.spiderName}_failed`, 1);
                        await this.timeBucket1h.put(`${this.spiderName}_failed`, 1);
                        await this.timeBucket1d.put(`${this.spiderName}_failed`, 1);
                        await this.timeBucketAll.put(`${this.spiderName}_failed`, 1);
                    }
                }
            }

            task.track.process.time = new Date().getTime() - processStartTime;
            await TaskDB.updateTask(this.getSpiderName(), task);
            done();
        };
    }

    private async retryImmediately(options) {
        const opts = Object.assign({}, options, {priority: Priori._0().value});
        await this.crawler.queue(opts);
    }

    private async retry(options) {
        const opts = Object.assign({}, options, {priority: Priori._0().value});
        await new Promise(async (resolve, reject) => {
            if (opts.retries) {
                setTimeout(async () => {
                    opts.retries -= 1;
                    await this.crawler.queue(opts);
                    resolve();
                }, opts.retryTimeout);
            } else {
                reject(new Error('重试达到最大次数'));
            }
        });
    }

    protected crawlDirect(options) {
        this.crawler.direct.bind(this.crawler)(options);
    }


    private async crawlDebug(options) {
        const {callback: callbackFunctionName, uri} = options;
        const saves = options.saves || {};

        if (typeof this[callbackFunctionName] !== 'function') {
            throw new Error(`${callbackFunctionName} 不是一个function`);
        }

        let res = null;
        const result = new Result();
        if (uri.startsWith('data:')) {
            const buf = dataUriToBuffer(uri);
            res = {body: buf.toString(), headers: {'content-type': buf['type']}};
        } else {
            // 爬取
            await new Promise(async (resolve) => {
                await this.DefaultPreRequest(options, () => {
                    resolve();
                });
            });
            res = await new Promise((resolve, reject) => {
                this.crawlDirect(Object.assign({}, options, {
                    callback: (error, response) => {
                        if (error) {
                            // logger.error(error);
                            reject(error);
                        } else {
                            resolve(response);
                        }
                    },
                }));
            });
        }

        if (callbackFunctionName === this.start.name) {
            await this[callbackFunctionName](result);
        } else {
            await this[callbackFunctionName](res, saves, result);
        }

        let {follows, data, debugInfo} = result;
        follows = follows.map(follow => Object.assign({
            age: this.defaultAge,
            priority: this.defaultPriority.value,
        }, follow, {callback: getCallbackFunctionName(follow.callback)}));
        return {follows, data, debugInfo, content: res['body']};
    }

    private async crawl(options: Follow) {
        const opts: any = Object.assign({age: this.defaultAge, priority: this.defaultPriority}, options);
        opts.priority = opts.priority.value;

        const {
            uri, callback, preTaskId, tags,
        } = opts;
        const age = typeof opts.age === 'string' ? Math.floor(timeLen(opts.age) / 1000) : opts.age;
        const spiderName = this.getSpiderName();
        const taskId = md5(uri);

        opts.callback = getCallbackFunctionName(callback);

        if (uri.startsWith('data:')) {
            opts.html = dataUriToBuffer(uri).toString();
        }

        const oldTask = await TaskDB.getTask(this.spiderName, taskId, ['lastcrawltime', 'status']);
        if (oldTask) {
            if (oldTask.status === Enums.taskStatus.active) { // 任务还没爬取
                this.logger.warn(`任务已经存在，并且还未爬取， 本次将被忽略 ${uri}`);
                return null;
            }

            if (age === -1) { // 永不过期
                this.logger.warn(`任务已经存在，并且未过期【由于age=-1, 永不过期】， 本次将被忽略 ${uri}`);
                return null;
            }

            if (this.currentTimestamp() - oldTask.lastcrawltime < age) { // 任务还没过期
                this.logger.warn(`任务已经存在，并且未过期【@@@】， 本次将被忽略 ${uri}`);
                return null;
            }

            this.logger.warn(`任务已过期【@@@】， 重新爬取 ${uri}`);
            // 更新任务状态为【待爬取】
            await TaskDB.updateTask(spiderName, {
                id: taskId,
                preTaskId,
                options: opts,
                scheduletime: (new Date()).getTime() / 1000,
                status: 1,
                tags,
            });
        } else {
            await TaskDB.insertTask(spiderName, {
                id: taskId,
                preTaskId,
                uri,
                // callback: callbackFunctionName,
                options: opts,
                tags,
            });
        }

        // 将任务加入爬取队列
        await this.queue(opts, taskId);
        await this.timeBucket5m.put(`${this.spiderName}_newly`, 1);
        await this.timeBucket1h.put(`${this.spiderName}_newly`, 1);
        await this.timeBucket1d.put(`${this.spiderName}_newly`, 1);
        await this.timeBucketAll.put(`${this.spiderName}_newly`, 1);
        return taskId;
    }

    private async queue(options, taskId) {
        const {callback} = options;
        await this.crawler.queue(Object.assign({}, options, {
            taskInfo: {
                taskId,
            },
            callback: this.wrapCallback(callback, taskId),
        }));
    }

    private async initCrawler() {
        const crawler = createCrawler({
            rateLimit: this.rate,
            preRequest: async (options, done) => {
                const status = this.status;
                if (status === Enums.spiderStatus.running) {
                    await this.DefaultPreRequest(options, done);
                } else { // 停止
                    // spider 处于【非运行】状态，退出所有爬取任务
                    const err = new Error(`Spider[${this.spiderName}]处于【非运行】状态[${status}], 爬取任务取消`);
                    err['op'] = 'abort';
                    done(err);
                    // this.seenReq.dispose();
                }
            },
        });
        this.crawler = crawler;

        // Emitted when a task is being added to scheduler.
        crawler.on('schedule', async (options) => {
            // options.proxy = "http://proxy:port";
            await this.onSchedule(options);
        });

        // Emitted when crawler is ready to send a request.
        crawler.on('request', async (options) => {
            this.logger.debug(`a request will start [${options.uri}]`);
            if (options.taskInfo) {
                Object.assign(options.taskInfo, {crawlStartTime: new Date().getTime()});
            }
            await this.onRequest(options);
        });

        // Emitted when queue is empty.
        crawler.on('drain', async () => {
            // appLogger.info('queue is empty.');
            // appLogger.info(`queueSize:${crawler.queueSize}`);
            await this.onDrain();
        });

        if (this.status === Enums.spiderStatus.running) {
            await this.loadTasks();
        }
    }

    /**
     * 当一个Task将要发送request时调用
     * @param options
     */
    protected async onRequest(options) {
    }

    /**
     * 当一个Task被添加到爬取队列时调用
     */
    protected async onSchedule(options) {
    }

    /**
     * 当爬取队列为空时调用
     */
    protected async onDrain() {
    }

    private async loadTasks() {
        const spiderName = this.getSpiderName();
        const tasks = await TaskDB.loadTasksForRun(spiderName);
        const promises = tasks.map(async (task) => {
            const options = JSON.parse(task.options);
            await this.queue(options, task.id);
        });
        await Promise.all(promises);
    }

    private async callStart() {
        const follow: Follow = {uri: 'data:,on_start', callback: this.start, age: '0', priority: Priori._10()};
        await this.crawl(follow);
    }

    protected abstract async start(result: Result): Promise<void>

    protected async cbDefault(res, saves: object, result: Result): Promise<void> {

    }

    private currentTimestamp() {
        return new Date().getTime() / 1000;
    }
}


export default BaseSpider;

export function createCallbackBeforeCheck(fn) {
    return (target, name, descriptor) => {
        const oldFn = descriptor.value;
        const fnName = oldFn.callbackFunctionName || oldFn.name;

        const newFn = async function (...args) {
            await fn.apply(this, args);

            const ret = oldFn.apply(this, args);
            return ret;
        };
        newFn['callbackFunctionName'] = fnName;

        descriptor.value = newFn;
        return descriptor;
    }
}

export interface Callback {
    (res, saves: object, result: Result): void;
}

export class Priority {
    readonly value: number;

    protected constructor(value: number) {
        this.value = value;
    }

    static _3() {
        return new Priority(3);
    }

    static _4() {
        return new Priority(4);
    }

    static _5() {
        return new Priority(5);
    }

    static _6() {
        return new Priority(6);
    }

    static _7() {
        return new Priority(7);
    }
}

class Priori extends Priority {

    private constructor(value: number) {
        super(value);
    }

    static _0() {
        return new Priori(0);
    }

    static _1() {
        return new Priori(1);
    }

    static _2() {
        return new Priori(2);
    }

    static _8() {
        return new Priori(8);
    }

    static _9() {
        return new Priori(9);
    }

    static _10() {
        return new Priori(10);
    }
}

export class Follow {
    priority?: Priority;
    uri: string;
    callback: Callback;
    tags?: string;
    age?: string;
    preTaskId?: string;
    html?: string;
    saves?: any;
    // [propName: string]: any;
}

export class Data {
    $table: string;
    id: string;

    [propName: string]: any;
}

export class Result {
    follows: Array<Follow> = [];
    data: Data[] = [];
    debugInfo: any[] = [];

    /**
     * 向结果中添加一条数据
     * @param {Data} data
     */
    addData(data: Data) {
        this.data.push(data);
    }

    /**
     * 向结果中添加一个Follow
     * @param {Data} data
     */
    addFollow(follow: Follow) {
        this.follows.push(follow);
    }

    addDebugInfo(debugInfo: any) {
        this.debugInfo.push({
            time: new Date().getTime()/ 1000,
            info: debugInfo,
        });
    }
}
