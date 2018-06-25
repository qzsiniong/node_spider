declare module '@/config/default' {
	 const Config: {
	    logLevel: string;
	    apiPath: string;
	    spidersPath: string;
	    servicesPath: string;
	    email: {
	        host: string;
	        port: number;
	        user: string;
	        pass: string;
	    };
	    redis: {
	        host: string;
	        port: number;
	    };
	    db: {
	        host: string;
	        port: number;
	        user: string;
	        password: string;
	        databases: {
	            spider: string;
	            task: string;
	            result: string;
	            data: string;
	        };
	    };
	};
	export default Config;

}
declare module '@/src/utils/LoggerUtils' {
	import * as log4js from 'log4js';
	export function getAppLogger(): log4js.Logger;
	export function getRequestLogger(): log4js.Logger;
	export function getSpiderLogger(spiderKey: any): any;

}
declare module '@/src/utils/CounterByTime' {
	export default class TimeBucket {
	    private bucket;
	    private range;
	    private particle;
	    private size;
	    private head;
	    private filePath;
	    constructor(range: any, particle: any);
	    save(): Promise<{}>;
	    load(filePath: any): Promise<{}>;
	    get(key: any, range: any): number;
	    put(key: any, value: any): Promise<{}>;
	    private _start();
	    private now();
	    private _getParticleIndex(current);
	    private _getParticle(index);
	    static newInstance(range: any, particle: any, filePath: any): Promise<TimeBucket>;
	}

}
declare module '@/src/utils/StringUtils' {
	/**
	 * 在一个字符串中查找【子字符串】
	 * @param string 源字符串
	 * @param reg 正则
	 * @param {string} deft 默认值
	 * @param {number} idx
	 * @returns {string}
	 */
	export const findString: (string: any, reg: RegExp, deft?: string, idx?: number) => string;
	export function f(): void;

}
declare module '@/src/spider/Enums' {
	 const _default: {
	    taskStatus: {
	        active: number;
	        success: number;
	        failed: number;
	        bad: number;
	    };
	    spiderStatus: {
	        running: string;
	        todo: string;
	        checking: string;
	        stop: string;
	    };
	};
	export default _default;

}
declare module '@/src/spider/createCrawler' {
	 const createCrawler: (opts: any) => any;
	export default createCrawler;

}
declare module '@/src/spider/errors/MyError' {
	export default class MyError extends Error {
	    constructor(message: any);
	}

}
declare module '@/src/spider/errors/RetryImmediatelyError' {
	import MyError from '@/src/spider/errors/MyError';
	export default class RetryImmediatelyError extends MyError {
	}

}
declare module '@/src/spider/errors/FailedError' {
	import MyError from '@/src/spider/errors/MyError';
	export default class FailedError extends MyError {
	}

}
declare module '@/src/utils/Utils' {
	export function delay(t: any): Promise<{}>;
	/**
	 * 将给定变量转换为数组
	 * 1. 变量为数组，返回 变量本身
	 * 2. 变量为 null/undefined ,返回空数组
	 * 3. 其它，返回数组（有一个元素为变量本身）
	 * @param obj
	 * @returns {*}
	 */
	export function toArray(obj: any): any[];
	export function unlinkIfExists(filePath: string): Promise<{}>;
	export function readFile(filePath: string): Promise<{}>;
	export function readDir(filePath: string): Promise<any>;

}
declare module '@/src/spider/database/DB' {
	import { PoolConnection } from "promise-mysql";
	export function dataQueryWithTransaction(fn: (conn: PoolConnection) => any): Promise<{}>;
	export function taskQuery(sql: any, values?: any): Promise<any>;
	export function spiderQuery(sql: any, values?: any): Promise<any>;
	export function dataQuery(sql: string, values?: any): Promise<any>; const DB: {
	    dataQueryWithTransaction: (fn: (conn: PoolConnection) => any) => Promise<{}>;
	    taskQuery: (sql: any, values?: any) => Promise<any>;
	    spiderQuery: (sql: any, values?: any) => Promise<any>;
	    dataQuery: (sql: string, values?: any) => Promise<any>;
	    resultQuery: (sql: any, values: any) => Promise<any>;
	    mysql: any;
	};
	export default DB;

}
declare module '@/src/spider/database/SpiderDB' {
	export function getSpider(spiderName: any): Promise<any>;
	export function insertSpider(spider: any): Promise<any>;
	export function updateSpider(spider: any): Promise<any>;
	export function listSpiders(): Promise<any>; const SpiderDB: {
	    getSpider: (spiderName: any) => Promise<any>;
	    insertSpider: (spider: any) => Promise<any>;
	    updateSpider: (spider: any) => Promise<any>;
	    listSpiders: () => Promise<any>;
	};
	export default SpiderDB;

}
declare module '@/src/spider/database/TaskDB' {
	export function insertTask(spiderName: any, task: any): Promise<any>;
	export function updateTask(spiderName: any, task: any): Promise<any>;
	export function loadTasksForRun(spiderName: any): Promise<any>;
	export function listTasks(spiderName: any, limit: string, status: any, tags: any): Promise<{
	    list: any;
	    total: any;
	}>;
	export function getTask(spiderName: any, taskId: any, fields?: string[]): Promise<any>;
	export function deleteTask(spiderName: any, taskId: any): Promise<boolean>;
	export function countByStatus(spiderName: any): Promise<{}>; const TaskDB: {
	    insertTask: (spiderName: any, task: any) => Promise<any>;
	    updateTask: (spiderName: any, task: any) => Promise<any>;
	    loadTasksForRun: (spiderName: any) => Promise<any>;
	    listTasks: (spiderName: any, limit: string, status: any, tags: any) => Promise<{
	        list: any;
	        total: any;
	    }>;
	    getTask: (spiderName: any, taskId: any, fields?: string[]) => Promise<any>;
	    deleteTask: (spiderName: any, taskId: any) => Promise<boolean>;
	    countByStatus: (spiderName: any) => Promise<{}>;
	};
	export default TaskDB;

}
declare module '@/src/BaseSpider' {
	 abstract class BaseSpider {
	    protected readonly logger: any;
	    protected readonly cheerio: CheerioAPI;
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
	    protected constructor({timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, version}: {
	        timeBucket5m: any;
	        timeBucket1h: any;
	        timeBucket1d: any;
	        timeBucketAll: any;
	        version: any;
	    });
	    /**
	     * 默认过期时间 单位【秒】
	     * @type {number|string}
	     */
	    protected defaultAge: number | string;
	    /**
	     * 默认优先级，0-10，数值越小优先级越高
	     * @type {number}
	     */
	    protected defaultPriority: Priority;
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    protected md5(message: string | Buffer): string;
	    private initSpider();
	    protected dataQuery(sql: string, values?: any): Promise<any>;
	    private getStatus();
	    private setStatus(status);
	    private setRate(rate);
	    private setCronTime(cronTime);
	    private getSpiderName();
	    private getSpiderTableName();
	    private startCron();
	    private stopCron();
	    private storeData(data);
	    private wrapCallback(callbackFunctionName, taskId);
	    private retryImmediately(options);
	    private retry(options);
	    protected crawlDirect(options: any): void;
	    private crawlDebug(options);
	    private crawl(options);
	    private queue(options, taskId);
	    private initCrawler();
	    /**
	     * 当一个Task将要发送request时调用
	     * @param options
	     */
	    protected onRequest(options: any): Promise<void>;
	    /**
	     * 当一个Task被添加到爬取队列时调用
	     */
	    protected onSchedule(options: any): Promise<void>;
	    /**
	     * 当爬取队列为空时调用
	     */
	    protected onDrain(): Promise<void>;
	    private loadTasks();
	    private callStart();
	    protected abstract start(result: Result): Promise<void>;
	    protected cbDefault(res: any, saves: object, result: Result): Promise<void>;
	    private currentTimestamp();
	}
	export default BaseSpider;
	export function createCallbackBeforeCheck(fn: any): (target: any, name: any, descriptor: any) => any;
	export interface Callback {
	    (res: any, saves: object, result: Result): void;
	}
	export class Priority {
	    readonly value: number;
	    protected constructor(value: number);
	    static _3(): Priority;
	    static _4(): Priority;
	    static _5(): Priority;
	    static _6(): Priority;
	    static _7(): Priority;
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
	}
	export class Data {
	    $table: string;
	    id: string;
	    [propName: string]: any;
	}
	export class Result {
	    follows: Array<Follow>;
	    data: Data[];
	    debugInfo: any[];
	    /**
	     * 向结果中添加一条数据
	     * @param {Data} data
	     */
	    addData(data: Data): void;
	    /**
	     * 向结果中添加一个Follow
	     * @param {Data} data
	     */
	    addFollow(follow: Follow): void;
	    addDebugInfo(debugInfo: any): void;
	}

}
declare module '@/src/spider/loadSpider' {
	export default function loadSpider(spiderFilename: any, spiderMap: any, timeBucket5m: any, timeBucket1h: any, timeBucket1d: any, timeBucketAll: any): Promise<void>;

}
declare module '@/src/spider/reloadConfig' {
	import TimeBucket from '@/src/utils/CounterByTime'; const reloadConfig: () => Promise<{
	    spiderMap: {};
	    timeBucket5m: TimeBucket;
	    timeBucket1h: TimeBucket;
	    timeBucket1d: TimeBucket;
	    timeBucketAll: TimeBucket;
	}>;
	export default reloadConfig;

}
declare module '@/src/Application' {
	import { ApplicationLoader } from "loon";
	export class Application extends ApplicationLoader {
	    spiderMap: any;
	    timeBucket5m: any;
	    timeBucket1h: any;
	    timeBucket1d: any;
	    timeBucketAll: any;
	    constructor();
	    $beforeInit(): Promise<void>;
	    $afterInit(): void;
	}

}
declare module '@/src/controllers/SpiderController' {
	/// <reference types="express" />
	import * as Express from 'express';
	export class SpiderController {
	    getSpiders(q: string, res: Express.Response): Promise<void>;
	    getSpider(spiderName: string, taskId: string, req: string, res: Express.Response): Promise<void>;
	    private tsc(spiderFilename);
	    updateSpiderCode(spiderName: string, req: string, res: Express.Response): Promise<void>;
	    updateSpider(spiderName: string, req: string, res: Express.Response): Promise<void>;
	    debugSpider(spiderName: string, req: string, res: Express.Response): Promise<void>;
	    startSpider(spiderName: string, req: string, res: Express.Response): Promise<void>;
	}

}
declare module '@/src/controllers/SpiderInfoController' {
	/// <reference types="express" />
	import * as Express from 'express';
	export class SpiderInfoController {
	    getSpidersInfo(res: Express.Response): Promise<void>;
	}

}
declare module '@/src/controllers/TaskController' {
	/// <reference types="express" />
	import * as Express from 'express';
	export class TaskController {
	    getTasks(spiderName: string, limit: string, status: string, tags: string, res: Express.Response): Promise<void>;
	    getTask(spiderNameTaskId: string, res: Express.Response): Promise<void>;
	    recrawl(spiderNameTaskId: string, res: Express.Response): Promise<void>;
	    deleteTask(spiderNameTaskId: string, res: Express.Response): Promise<void>;
	}

}
declare module '@/src/services/HouseEsfService' {
	export default class HouseEsfService {
	    save(house: any): Promise<void>;
	}

}
declare module '@/src/spiders/SpiderEsf58KM' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderEsf58KM extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbList(res, saves, result);
	    private cbDetail(res, saves, result);
	}

}
declare module '@/src/spiders/SpiderTianYanChaCompanyNn-0' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderTianYanChaCompanyNn extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbIndex(res, saves, result);
	    private cbList(res, saves, result);
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    private jar;
	    login(): Promise<void>;
	}

}
declare module '@/src/spiders/SpiderTianYanChaCompanyNn-1' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderTianYanChaCompanyNn extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbIndex(res, saves, result);
	    private cbList(res, saves, result);
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    private jar;
	    login(): Promise<void>;
	}

}
declare module '@/src/spiders/SpiderTianYanChaCompanyNn-2' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderTianYanChaCompanyNn extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbIndex(res, saves, result);
	    private cbList(res, saves, result);
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    private jar;
	    login(): Promise<void>;
	}

}
declare module '@/src/spiders/SpiderTianYanChaCompanyNn-3' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderTianYanChaCompanyNn extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbIndex(res, saves, result);
	    private cbList(res, saves, result);
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    private jar;
	    login(): Promise<void>;
	}

}
declare module '@/src/spiders/SpiderTianYanChaCompanyNn-4' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderTianYanChaCompanyNn extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbIndex(res, saves, result);
	    private cbList(res, saves, result);
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    private jar;
	    login(): Promise<void>;
	}

}
declare module '@/src/spiders/SpiderTianYanChaCompanyNn-5' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderTianYanChaCompanyNn extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbIndex(res, saves, result);
	    private cbList(res, saves, result);
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    private jar;
	    login(): Promise<void>;
	}

}
declare module '@/src/spiders/SpiderTianYanChaCompanyNn' {
	import BaseSpider, { Result } from '@/src/BaseSpider';
	export default class SpiderTianYanChaCompanyNn extends BaseSpider {
	    defaultAge: string;
	    protected start(result: Result): Promise<void>;
	    private cbIndex(res, saves, result);
	    private cbList(res, saves, result);
	    protected DefaultPreRequest(options: any, done: any): Promise<void>;
	    private jar;
	    login(): Promise<void>;
	}

}
