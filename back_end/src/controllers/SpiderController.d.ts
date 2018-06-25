/// <reference types="express" />
import * as Express from 'express';
export declare class SpiderController {
    getSpiders(q: string, res: Express.Response): Promise<void>;
    getSpider(spiderName: string, taskId: string, req: string, res: Express.Response): Promise<void>;
    private tsc(spiderFilename);
    updateSpiderCode(spiderName: string, req: string, res: Express.Response): Promise<void>;
    updateSpider(spiderName: string, req: string, res: Express.Response): Promise<void>;
    debugSpider(spiderName: string, req: string, res: Express.Response): Promise<void>;
    startSpider(spiderName: string, req: string, res: Express.Response): Promise<void>;
}
