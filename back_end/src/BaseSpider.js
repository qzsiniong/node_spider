"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Spider
 */
const md5 = require("md5");
const timeLen = require("time-len");
const cheerio = require("cheerio");
const cron_1 = require("cron");
const dataUriToBuffer = require("data-uri-to-buffer");
const createCrawler_1 = require("./spider/createCrawler");
const Enums_1 = require("./spider/Enums");
const RetryImmediatelyError_1 = require("./spider/errors/RetryImmediatelyError");
const FailedError_1 = require("./spider/errors/FailedError");
const LoggerUtils_1 = require("./utils/LoggerUtils");
const default_1 = require("../config/default");
const Utils_1 = require("./utils/Utils");
const DB_1 = require("./spider/database/DB");
const SpiderDB_1 = require("./spider/database/SpiderDB");
const TaskDB_1 = require("./spider/database/TaskDB");
const appLogger = LoggerUtils_1.getAppLogger();
const getCallbackFunctionName = (callback) => {
    if (typeof callback === 'string') {
        return callback;
    }
    return callback.callbackFunctionName || callback.name;
};
class BaseSpider {
    constructor({ timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, version, }) {
        this.cheerio = cheerio;
        /**
         * 默认过期时间 单位【秒】
         * @type {number|string}
         */
        this.defaultAge = -1;
        /**
         * 默认优先级，0-10，数值越小优先级越高
         * @type {number}
         */
        this.defaultPriority = Priority._5();
        // this.seenReq = new SeenReq({
        // });
        this.logger = LoggerUtils_1.getSpiderLogger(this.getSpiderName());
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
    DefaultPreRequest(options, done) {
        return __awaiter(this, void 0, void 0, function* () {
            done();
        });
    }
    md5(message) {
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
    initSpider() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitSpider) {
                return;
            }
            this.isInitSpider = true;
            yield DB_1.default.taskQuery(`
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
            let spider = yield SpiderDB_1.default.getSpider(this.spiderName);
            if (spider === null) {
                yield SpiderDB_1.default.insertSpider({ name: this.spiderName });
                spider = yield SpiderDB_1.default.getSpider(this.spiderName);
            }
            this.status = spider.status;
            this.groups = spider.groups;
            this.rate = spider.rate;
            this.cronTime = spider.crontime;
            yield this.initCrawler();
            yield this.setStatus(spider.status);
        });
    }
    dataQuery(sql, values) {
        return __awaiter(this, void 0, void 0, function* () {
            return DB_1.default.dataQuery(sql, values);
        });
    }
    getStatus() {
        return this.status;
    }
    setStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status === status) {
                return;
            }
            if (status === Enums_1.default.spiderStatus.running) {
                while (this.crawler.queueSize) {
                    // console.log(`waiting for a moment ,queueSize=${this.crawler.queueSize}`);
                    yield Utils_1.delay(1000);
                }
                // console.log(`queueSize may be zero, ${this.crawler.queueSize}, now loadTasks...`);
                this.status = status;
                yield this.loadTasks();
            }
            else {
                this.status = status;
                while (this.crawler.limiters.limiters.default._waitingClients.dequeue())
                    ;
            }
            yield SpiderDB_1.default.updateSpider({ name: this.spiderName, status });
        });
    }
    setRate(rate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.rate === rate) {
                return;
            }
            this.rate = rate;
            yield SpiderDB_1.default.updateSpider({ name: this.spiderName, rate });
            this.crawler.setLimiterProperty('default', 'rateLimit', rate);
        });
    }
    setCronTime(cronTime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cronTime === cronTime) {
                return;
            }
            this.cronTime = cronTime;
            yield SpiderDB_1.default.updateSpider({ name: this.spiderName, cronTime });
            this.stopCron();
            if (cronTime !== null) {
                this.startCron();
            }
        });
    }
    getSpiderName() {
        return this.constructor.name;
    }
    getSpiderTableName() {
        const spiderName = this.getSpiderName();
        return spiderName.replace(/[A-Z]/g, (s, i) => (i === 0 ? '' : '_') + s.toLowerCase());
    }
    startCron() {
        const { cronTime, spiderName } = this;
        let { cronJob } = this;
        if (cronJob && cronJob.running) {
            throw new Error('spider\'s cronJob is running, no need restart.');
        }
        if (!cronJob) {
            cronJob = new cron_1.CronJob({
                cronTime,
                onTick: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const status = this.getStatus();
                        if (status === Enums_1.default.spiderStatus.running) {
                            yield this.callStart();
                        }
                        else {
                            appLogger.warn(`${spiderName}'s status is ${status}(not 'running'), so not start it in it's cron.`);
                        }
                    }
                    catch (e) {
                        appLogger.error(e);
                    }
                }),
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
    stopCron() {
        const { cronJob } = this;
        if (cronJob && cronJob.running) {
            cronJob.stop();
            this.cronJob = null;
        }
    }
    storeData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const item of data) {
                const { $table: table } = item, d = __rest(item, ["$table"]);
                const serviceName = table.toLowerCase().replace(/(^|_)\w/g, (s) => s.substr(-1).toUpperCase()) + 'Service';
                try {
                    const { default: Service } = yield Promise.resolve().then(() => require(`${default_1.default.servicesPath}${serviceName}`));
                    const service = new Service();
                    if (typeof service.save === 'function') {
                        yield service.save(d);
                    }
                    else {
                        throw new Error(`${default_1.default.servicesPath}${serviceName}.save is not a function`);
                    }
                }
                catch (e) {
                    if (e.code === 'MODULE_NOT_FOUND') {
                        const [{ count }] = yield this.dataQuery(`SELECT COUNT(1) count FROM ${DB_1.default.mysql.escapeId(table)} WHERE id = ?`, d.id);
                        if (count > 0) {
                            const { id } = d, dd = __rest(d, ["id"]);
                            dd.update_at = new Date();
                            yield this.dataQuery(`UPDATE ${DB_1.default.mysql.escapeId(table)} SET ? WHERE id = ?`, [dd, id]);
                        }
                        else {
                            yield this.dataQuery(`INSERT INTO ${DB_1.default.mysql.escapeId(table)} SET ?`, d);
                        }
                    }
                    else {
                        appLogger.error(e);
                        throw e;
                    }
                }
            }
        });
    }
    wrapCallback(callbackFunctionName, taskId) {
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
        return (error, res, done) => __awaiter(this, void 0, void 0, function* () {
            const { taskInfo } = res.options;
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
                task.status = Enums_1.default.taskStatus.failed;
            }
            else {
                try {
                    task.body = res.body;
                    const result = new Result();
                    if (callbackFunctionName === this.start.name) {
                        yield callbackFunction(result);
                    }
                    else {
                        yield callbackFunction(res, res.options.saves || {}, result);
                    }
                    const { follows, data } = result;
                    const followIds = [];
                    /* eslint-disable no-await-in-loop,no-restricted-syntax */
                    for (const follow of follows) {
                        follow.preTaskId = taskId;
                        const followTaskId = yield this.crawl(follow);
                        if (followTaskId) {
                            followIds.push(followTaskId);
                        }
                    }
                    /* eslint-enable no-await-in-loop,no-restricted-syntax */
                    task.track.process.follows = followIds;
                    task.track.process.data = data;
                    yield this.storeData(data);
                    task.status = Enums_1.default.taskStatus.success;
                    yield this.timeBucket5m.put(`${this.spiderName}_success`, 1);
                    yield this.timeBucket1h.put(`${this.spiderName}_success`, 1);
                    yield this.timeBucket1d.put(`${this.spiderName}_success`, 1);
                    yield this.timeBucketAll.put(`${this.spiderName}_success`, 1);
                }
                catch (e) {
                    const { options } = res;
                    const uri = options.uri || options.url;
                    if (e instanceof RetryImmediatelyError_1.default) {
                        // 立即重试一次
                        this.logger.debug(`retry immediately ${uri}`);
                        yield this.retryImmediately(options);
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
                    if (options.retries && !(e instanceof FailedError_1.default)) {
                        yield this.retry(options);
                        task.status = Enums_1.default.taskStatus.bad;
                        yield this.timeBucket5m.put(`${this.spiderName}retry`, 1);
                        yield this.timeBucket1h.put(`${this.spiderName}retry`, 1);
                        yield this.timeBucket1d.put(`${this.spiderName}retry`, 1);
                        yield this.timeBucketAll.put(`${this.spiderName}retry`, 1);
                    }
                    else {
                        task.status = Enums_1.default.taskStatus.failed;
                        yield this.timeBucket5m.put(`${this.spiderName}_failed`, 1);
                        yield this.timeBucket1h.put(`${this.spiderName}_failed`, 1);
                        yield this.timeBucket1d.put(`${this.spiderName}_failed`, 1);
                        yield this.timeBucketAll.put(`${this.spiderName}_failed`, 1);
                    }
                }
            }
            task.track.process.time = new Date().getTime() - processStartTime;
            yield TaskDB_1.default.updateTask(this.getSpiderName(), task);
            done();
        });
    }
    retryImmediately(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const opts = Object.assign({}, options, { priority: Priori._0().value });
            yield this.crawler.queue(opts);
        });
    }
    retry(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const opts = Object.assign({}, options, { priority: Priori._0().value });
            yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (opts.retries) {
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        opts.retries -= 1;
                        yield this.crawler.queue(opts);
                        resolve();
                    }), opts.retryTimeout);
                }
                else {
                    reject(new Error('重试达到最大次数'));
                }
            }));
        });
    }
    crawlDirect(options) {
        this.crawler.direct.bind(this.crawler)(options);
    }
    crawlDebug(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { callback: callbackFunctionName, uri } = options;
            const saves = options.saves || {};
            if (typeof this[callbackFunctionName] !== 'function') {
                throw new Error(`${callbackFunctionName} 不是一个function`);
            }
            let res = null;
            const result = new Result();
            if (uri.startsWith('data:')) {
                const buf = dataUriToBuffer(uri);
                res = { body: buf.toString(), headers: { 'content-type': buf['type'] } };
            }
            else {
                // 爬取
                yield new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    yield this.DefaultPreRequest(options, () => {
                        resolve();
                    });
                }));
                res = yield new Promise((resolve, reject) => {
                    this.crawlDirect(Object.assign({}, options, {
                        callback: (error, response) => {
                            if (error) {
                                // logger.error(error);
                                reject(error);
                            }
                            else {
                                resolve(response);
                            }
                        },
                    }));
                });
            }
            if (callbackFunctionName === this.start.name) {
                yield this[callbackFunctionName](result);
            }
            else {
                yield this[callbackFunctionName](res, saves, result);
            }
            let { follows, data, debugInfo } = result;
            follows = follows.map(follow => Object.assign({
                age: this.defaultAge,
                priority: this.defaultPriority.value,
            }, follow, { callback: getCallbackFunctionName(follow.callback) }));
            return { follows, data, debugInfo, content: res['body'] };
        });
    }
    crawl(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const opts = Object.assign({ age: this.defaultAge, priority: this.defaultPriority }, options);
            opts.priority = opts.priority.value;
            const { uri, callback, preTaskId, tags, } = opts;
            const age = typeof opts.age === 'string' ? Math.floor(timeLen(opts.age) / 1000) : opts.age;
            const spiderName = this.getSpiderName();
            const taskId = md5(uri);
            opts.callback = getCallbackFunctionName(callback);
            if (uri.startsWith('data:')) {
                opts.html = dataUriToBuffer(uri).toString();
            }
            const oldTask = yield TaskDB_1.default.getTask(this.spiderName, taskId, ['lastcrawltime', 'status']);
            if (oldTask) {
                if (oldTask.status === Enums_1.default.taskStatus.active) {
                    this.logger.warn(`任务已经存在，并且还未爬取， 本次将被忽略 ${uri}`);
                    return null;
                }
                if (age === -1) {
                    this.logger.warn(`任务已经存在，并且未过期【由于age=-1, 永不过期】， 本次将被忽略 ${uri}`);
                    return null;
                }
                if (this.currentTimestamp() - oldTask.lastcrawltime < age) {
                    this.logger.warn(`任务已经存在，并且未过期【@@@】， 本次将被忽略 ${uri}`);
                    return null;
                }
                this.logger.warn(`任务已过期【@@@】， 重新爬取 ${uri}`);
                // 更新任务状态为【待爬取】
                yield TaskDB_1.default.updateTask(spiderName, {
                    id: taskId,
                    preTaskId,
                    options: opts,
                    scheduletime: (new Date()).getTime() / 1000,
                    status: 1,
                    tags,
                });
            }
            else {
                yield TaskDB_1.default.insertTask(spiderName, {
                    id: taskId,
                    preTaskId,
                    uri,
                    // callback: callbackFunctionName,
                    options: opts,
                    tags,
                });
            }
            // 将任务加入爬取队列
            yield this.queue(opts, taskId);
            yield this.timeBucket5m.put(`${this.spiderName}_newly`, 1);
            yield this.timeBucket1h.put(`${this.spiderName}_newly`, 1);
            yield this.timeBucket1d.put(`${this.spiderName}_newly`, 1);
            yield this.timeBucketAll.put(`${this.spiderName}_newly`, 1);
            return taskId;
        });
    }
    queue(options, taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { callback } = options;
            yield this.crawler.queue(Object.assign({}, options, {
                taskInfo: {
                    taskId,
                },
                callback: this.wrapCallback(callback, taskId),
            }));
        });
    }
    initCrawler() {
        return __awaiter(this, void 0, void 0, function* () {
            const crawler = createCrawler_1.default({
                rateLimit: this.rate,
                preRequest: (options, done) => __awaiter(this, void 0, void 0, function* () {
                    const status = this.status;
                    if (status === Enums_1.default.spiderStatus.running) {
                        yield this.DefaultPreRequest(options, done);
                    }
                    else {
                        // spider 处于【非运行】状态，退出所有爬取任务
                        const err = new Error(`Spider[${this.spiderName}]处于【非运行】状态[${status}], 爬取任务取消`);
                        err['op'] = 'abort';
                        done(err);
                        // this.seenReq.dispose();
                    }
                }),
            });
            this.crawler = crawler;
            // Emitted when a task is being added to scheduler.
            crawler.on('schedule', (options) => __awaiter(this, void 0, void 0, function* () {
                // options.proxy = "http://proxy:port";
                yield this.onSchedule(options);
            }));
            // Emitted when crawler is ready to send a request.
            crawler.on('request', (options) => __awaiter(this, void 0, void 0, function* () {
                this.logger.debug(`a request will start [${options.uri}]`);
                if (options.taskInfo) {
                    Object.assign(options.taskInfo, { crawlStartTime: new Date().getTime() });
                }
                yield this.onRequest(options);
            }));
            // Emitted when queue is empty.
            crawler.on('drain', () => __awaiter(this, void 0, void 0, function* () {
                // appLogger.info('queue is empty.');
                // appLogger.info(`queueSize:${crawler.queueSize}`);
                yield this.onDrain();
            }));
            if (this.status === Enums_1.default.spiderStatus.running) {
                yield this.loadTasks();
            }
        });
    }
    /**
     * 当一个Task将要发送request时调用
     * @param options
     */
    onRequest(options) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * 当一个Task被添加到爬取队列时调用
     */
    onSchedule(options) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * 当爬取队列为空时调用
     */
    onDrain() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    loadTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            const spiderName = this.getSpiderName();
            const tasks = yield TaskDB_1.default.loadTasksForRun(spiderName);
            const promises = tasks.map((task) => __awaiter(this, void 0, void 0, function* () {
                const options = JSON.parse(task.options);
                yield this.queue(options, task.id);
            }));
            yield Promise.all(promises);
        });
    }
    callStart() {
        return __awaiter(this, void 0, void 0, function* () {
            const follow = { uri: 'data:,on_start', callback: this.start, age: '0', priority: Priori._10() };
            yield this.crawl(follow);
        });
    }
    cbDefault(res, saves, result) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    currentTimestamp() {
        return new Date().getTime() / 1000;
    }
}
exports.default = BaseSpider;
function createCallbackBeforeCheck(fn) {
    return (target, name, descriptor) => {
        const oldFn = descriptor.value;
        const fnName = oldFn.callbackFunctionName || oldFn.name;
        const newFn = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fn.apply(this, args);
                const ret = oldFn.apply(this, args);
                return ret;
            });
        };
        newFn['callbackFunctionName'] = fnName;
        descriptor.value = newFn;
        return descriptor;
    };
}
exports.createCallbackBeforeCheck = createCallbackBeforeCheck;
class Priority {
    constructor(value) {
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
exports.Priority = Priority;
class Priori extends Priority {
    constructor(value) {
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
class Follow {
}
exports.Follow = Follow;
class Data {
}
exports.Data = Data;
class Result {
    constructor() {
        this.follows = [];
        this.data = [];
        this.debugInfo = [];
    }
    /**
     * 向结果中添加一条数据
     * @param {Data} data
     */
    addData(data) {
        this.data.push(data);
    }
    /**
     * 向结果中添加一个Follow
     * @param {Data} data
     */
    addFollow(follow) {
        this.follows.push(follow);
    }
    addDebugInfo(debugInfo) {
        this.debugInfo.push({
            time: new Date().getTime() / 1000,
            info: debugInfo,
        });
    }
}
exports.Result = Result;
//# sourceMappingURL=BaseSpider.js.map