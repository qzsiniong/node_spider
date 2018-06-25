/// <reference types="express" />
import * as Express from 'express';
export declare class TaskController {
    getTasks(spiderName: string, limit: string, status: string, tags: string, res: Express.Response): Promise<void>;
    getTask(spiderNameTaskId: string, res: Express.Response): Promise<void>;
    recrawl(spiderNameTaskId: string, res: Express.Response): Promise<void>;
    deleteTask(spiderNameTaskId: string, res: Express.Response): Promise<void>;
}
