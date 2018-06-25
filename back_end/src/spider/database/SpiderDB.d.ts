export declare function getSpider(spiderName: any): Promise<any>;
export declare function insertSpider(spider: any): Promise<any>;
export declare function updateSpider(spider: any): Promise<any>;
export declare function listSpiders(): Promise<any>;
declare const SpiderDB: {
    getSpider: (spiderName: any) => Promise<any>;
    insertSpider: (spider: any) => Promise<any>;
    updateSpider: (spider: any) => Promise<any>;
    listSpiders: () => Promise<any>;
};
export default SpiderDB;
