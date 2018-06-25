import fs = require("fs");
import path = require("path");

import {Get, Res, RestController, Inject, QueryParam, Req, Post, PathParam} from "loon";
import {CronJob} from 'cron';
import * as Express from 'express';
import * as gulp from "gulp";
import * as ts from "gulp-typescript";
import * as sourcemaps from 'gulp-sourcemaps';

import SpiderDB from "../spider/database/SpiderDB";
import TaskDB from "../spider/database/TaskDB";
import {getAppLogger} from "../utils/LoggerUtils";
import loadSpider from "../spider/loadSpider";
import {CompilationResult, TypeScriptError} from "gulp-typescript/release/reporter";
import {unlinkIfExists, readFile, readDir} from "../utils/Utils";
import Config from "../../config/default";

const appLogger = getAppLogger();

@RestController("/api/spiders")
export class SpiderController {

    @Get("")
    public async getSpiders(@QueryParam('q') q: string, @Res() res: Express.Response) {
        const results = await SpiderDB.listSpiders();
        res.json({list: results});
    }

    @Get("/:spiderName")
    public async getSpider(@PathParam('spiderName') spiderName: string, @QueryParam('taskId') taskId: string, @Req() req: string, @Res() res: Express.Response) {
        const {
            spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
        } = global['app'];
        const {version} = spiderMap[spiderName];

        let task = null;
        if (taskId) {
            task = await TaskDB.getTask(spiderName, taskId, ['options']);
        } else {
            task = {
                options: {
                    "uri": "data:,on_start",
                    "callback": "start",
                }
            };
        }

        const spiderFilename = version === -1 ? `${spiderName}.ts` : `${spiderName}-${version}.ts`;

        const dts = [(await readFile(path.resolve(__dirname, `../../all.d.ts`))).toString()];
        const data = await readFile(path.resolve(__dirname, `${Config.spidersPath}${spiderFilename}`));

        const types: string[] = await readDir(path.resolve(__dirname, `../../node_modules/@types/`));
        for (let i = 0; i < types.length; i++) {
            dts.push((await readFile(path.resolve(__dirname, `../../node_modules/@types/${types[i]}/index.d.ts`))).toString());
        }
        const types1 = await readDir(path.resolve(__dirname, `../../@types/`));
        for (let i = 0; i < types1.length; i++) {
            dts.push((await readFile(path.resolve(__dirname, `../../@types/${types1[i]}/index.d.ts`))).toString());
        }

        const code = data.toString()
            .replace(/\s+from\s+'\.\.\//g, " from '@/src/")
            .replace(/\s+from\s+"\.\.\//g, " from \"@/src/");
        res.json({
            data: {
                version,
                code,
                dts: dts,
                task: task ? task.options : null,
            },
        });
    }

    private async tsc(spiderFilename: string) {
        var tsProject = ts.createProject("tsconfig.json");
        return new Promise(((resolve, reject) => {
            let err = null;
            gulp.src(`${Config.spidersPath}${spiderFilename}.ts`)
                .pipe(sourcemaps.init()) // This means sourcemaps will be generated
                .pipe(tsProject({
                    error: function (error) {
                        err = error;
                    },
                    finish: function (result) {
                    }
                }))
                .pipe(sourcemaps.write('', {includeContent: false}))
                .pipe(gulp.dest(`${Config.spidersPath}`))
                .on('finish', () => {
                    if (err) reject(err);
                    resolve();
                });
        }));
    }

    @Post("/:spiderName/code")
    public async updateSpiderCode(@PathParam('spiderName') spiderName: string, @Req() req: string, @Res() res: Express.Response) {
        const {
            spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
        } = global['app'];
        const code = req['body']['code']
            .replace(/\s+from\s+'@\/src\//g, " from '../")
            .replace(/\s+from\s+"@\/src\//g, " from \"../");

        const version = spiderMap[spiderName].version + 1;
        const spiderFilename = `${spiderName}-${version}`;
        const filePath = path.resolve(__dirname, `${Config.spidersPath}${spiderFilename}`);

        fs.writeFile(`${filePath}.ts`, code, async (err) => {
            try {
                if (err) throw err;

                await this.tsc(spiderFilename);
                await loadSpider(`${spiderFilename}.js`, spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll);
            } catch (e) {
                await unlinkIfExists(`${filePath}.ts`);
                await unlinkIfExists(`${filePath}.js`);
                await unlinkIfExists(`${filePath}.js.map`);

                // appLogger.error(e);
                // appLogger.error('---------------------------------------------------------------');
                // console.log(e);
                res.json({
                    success: false,
                    data: {
                        errMsg: e.stack,
                    },
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    version,
                },
            });
        });
    }

    @Post("/:spiderName")
    public async updateSpider(@PathParam('spiderName') spiderName: string, @Req() req: string, @Res() res: Express.Response) {
        const {
            spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
        } = global['app'];

        const body = req['body'];
        const {name, value} = body;
        let errorMsg = null;
        let val = value;

        const spider = spiderMap[spiderName];
        if (!spider) {
            res.json({
                success: false,
            });
            return;
        }

        switch (name) {
            case 'status':
                await spider.setStatus(val);
                break;
            case 'rate':
                val = Number(value);
                if (Number.isNaN(val)) {
                    errorMsg = '无效的rate';
                } else if (val < 0) {
                    errorMsg = 'rate不能为负数';
                } else {
                    await spider.setRate(val);
                }
                break;
            case 'crontime':
                if (value.trim() === '') {
                    await spider.setCronTime(null);
                    val = null;
                } else {
                    try {
                        const _ = new CronJob(value);
                        await spider.setCronTime(value);
                    } catch (ex) {
                        errorMsg = '无效的cron表达式';
                    }
                }
                break;
            default:
                break;
        }

        if (errorMsg) {
            res.json({
                errMsg: errorMsg,
                success: false,
            });
        } else {
            res.json({
                msg: '修改成功',
                data: val,
                success: true,
            });
        }
    }

    @Post("/:spiderName/debug")
    public async debugSpider(@PathParam('spiderName') spiderName: string, @Req() req: string, @Res() res: Express.Response) {
        const {
            spiderMap
        } = global['app'];

        const body = req['body'];
        const {options} = body;
        let opts;
        try {
            opts = JSON.parse(options);
        } catch (e) {
            res.json({
                errMsg: 'json 格式错误',
                success: false,
            });
        }

        const spider = spiderMap[spiderName];
        try {
            const data = await spider.crawlDebug(opts);
            res.json({
                success: true,
                data,
            });
        } catch (e) {
            res.json({
                errMsg: e.message,
                success: false,
            });
        }
    }

    @Post("/:spiderName/start")
    public async startSpider(@PathParam('spiderName') spiderName: string, @Req() req: string, @Res() res: Express.Response) {
        const {
            spiderMap
        } = global['app'];

        const spider = spiderMap[spiderName];
        try {
            await spider.callStart();
            res.json({
                success: true,
                msg: '启动成功',
            });
        } catch (e) {
            res.json({
                errMsg: e.message,
                success: false,
            });
        }
    }
}
