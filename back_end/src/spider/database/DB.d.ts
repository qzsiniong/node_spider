import { PoolConnection } from "promise-mysql";
export declare function dataQueryWithTransaction(fn: (conn: PoolConnection) => any): Promise<{}>;
export declare function taskQuery(sql: any, values?: any): Promise<any>;
export declare function spiderQuery(sql: any, values?: any): Promise<any>;
export declare function dataQuery(sql: string, values?: any): Promise<any>;
declare const DB: {
    dataQueryWithTransaction: (fn: (conn: PoolConnection) => any) => Promise<{}>;
    taskQuery: (sql: any, values?: any) => Promise<any>;
    spiderQuery: (sql: any, values?: any) => Promise<any>;
    dataQuery: (sql: string, values?: any) => Promise<any>;
    resultQuery: (sql: any, values: any) => Promise<any>;
    mysql: any;
};
export default DB;
