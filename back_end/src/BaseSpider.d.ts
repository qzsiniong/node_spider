/// <reference types="node" />
declare abstract class BaseSpider {
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
export declare function createCallbackBeforeCheck(fn: any): (target: any, name: any, descriptor: any) => any;
export interface Callback {
    (res: any, saves: object, result: Result): void;
}
export declare class Priority {
    readonly value: number;
    protected constructor(value: number);
    static _3(): Priority;
    static _4(): Priority;
    static _5(): Priority;
    static _6(): Priority;
    static _7(): Priority;
}
export declare class Follow {
    priority?: Priority;
    uri: string;
    callback: Callback;
    tags?: string;
    age?: string;
    preTaskId?: string;
    html?: string;
    saves?: any;
}
export declare class Data {
    $table: string;
    id: string;
    [propName: string]: any;
}
export declare class Result {
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
