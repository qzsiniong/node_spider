"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const loon_1 = require("loon");
const cron_1 = require("cron");
const Express = require("express");
const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const SpiderDB_1 = require("../spider/database/SpiderDB");
const TaskDB_1 = require("../spider/database/TaskDB");
const LoggerUtils_1 = require("../utils/LoggerUtils");
const loadSpider_1 = require("../spider/loadSpider");
const Utils_1 = require("../utils/Utils");
const default_1 = require("../../config/default");
const appLogger = LoggerUtils_1.getAppLogger();
let SpiderController = class SpiderController {
    getSpiders(q, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield SpiderDB_1.default.listSpiders();
            res.json({ list: results });
        });
    }
    getSpider(spiderName, taskId, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, } = global['app'];
            const { version } = spiderMap[spiderName];
            let task = null;
            if (taskId) {
                task = yield TaskDB_1.default.getTask(spiderName, taskId, ['options']);
            }
            else {
                task = {
                    options: {
                        "uri": "data:,on_start",
                        "callback": "start",
                    }
                };
            }
            const spiderFilename = version === -1 ? `${spiderName}.ts` : `${spiderName}-${version}.ts`;
            const dts = [(yield Utils_1.readFile(path.resolve(__dirname, `../../all.d.ts`))).toString()];
            const data = yield Utils_1.readFile(path.resolve(__dirname, `${default_1.default.spidersPath}${spiderFilename}`));
            const types = yield Utils_1.readDir(path.resolve(__dirname, `../../node_modules/@types/`));
            for (let i = 0; i < types.length; i++) {
                dts.push((yield Utils_1.readFile(path.resolve(__dirname, `../../node_modules/@types/${types[i]}/index.d.ts`))).toString());
            }
            const types1 = yield Utils_1.readDir(path.resolve(__dirname, `../../@types/`));
            for (let i = 0; i < types1.length; i++) {
                dts.push((yield Utils_1.readFile(path.resolve(__dirname, `../../@types/${types1[i]}/index.d.ts`))).toString());
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
        });
    }
    tsc(spiderFilename) {
        return __awaiter(this, void 0, void 0, function* () {
            var tsProject = ts.createProject("tsconfig.json");
            return new Promise(((resolve, reject) => {
                let err = null;
                gulp.src(`${default_1.default.spidersPath}${spiderFilename}.ts`)
                    .pipe(sourcemaps.init()) // This means sourcemaps will be generated
                    .pipe(tsProject({
                    error: function (error) {
                        err = error;
                    },
                    finish: function (result) {
                    }
                }))
                    .pipe(sourcemaps.write('', { includeContent: false }))
                    .pipe(gulp.dest(`${default_1.default.spidersPath}`))
                    .on('finish', () => {
                    if (err)
                        reject(err);
                    resolve();
                });
            }));
        });
    }
    updateSpiderCode(spiderName, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, } = global['app'];
            const code = req['body']['code']
                .replace(/\s+from\s+'@\/src\//g, " from '../")
                .replace(/\s+from\s+"@\/src\//g, " from \"../");
            const version = spiderMap[spiderName].version + 1;
            const spiderFilename = `${spiderName}-${version}`;
            const filePath = path.resolve(__dirname, `${default_1.default.spidersPath}${spiderFilename}`);
            fs.writeFile(`${filePath}.ts`, code, (err) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (err)
                        throw err;
                    yield this.tsc(spiderFilename);
                    yield loadSpider_1.default(`${spiderFilename}.js`, spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll);
                }
                catch (e) {
                    yield Utils_1.unlinkIfExists(`${filePath}.ts`);
                    yield Utils_1.unlinkIfExists(`${filePath}.js`);
                    yield Utils_1.unlinkIfExists(`${filePath}.js.map`);
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
            }));
        });
    }
    updateSpider(spiderName, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, } = global['app'];
            const body = req['body'];
            const { name, value } = body;
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
                    yield spider.setStatus(val);
                    break;
                case 'rate':
                    val = Number(value);
                    if (Number.isNaN(val)) {
                        errorMsg = '无效的rate';
                    }
                    else if (val < 0) {
                        errorMsg = 'rate不能为负数';
                    }
                    else {
                        yield spider.setRate(val);
                    }
                    break;
                case 'crontime':
                    if (value.trim() === '') {
                        yield spider.setCronTime(null);
                        val = null;
                    }
                    else {
                        try {
                            const _ = new cron_1.CronJob(value);
                            yield spider.setCronTime(value);
                        }
                        catch (ex) {
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
            }
            else {
                res.json({
                    msg: '修改成功',
                    data: val,
                    success: true,
                });
            }
        });
    }
    debugSpider(spiderName, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap } = global['app'];
            const body = req['body'];
            const { options } = body;
            let opts;
            try {
                opts = JSON.parse(options);
            }
            catch (e) {
                res.json({
                    errMsg: 'json 格式错误',
                    success: false,
                });
            }
            const spider = spiderMap[spiderName];
            try {
                const data = yield spider.crawlDebug(opts);
                res.json({
                    success: true,
                    data,
                });
            }
            catch (e) {
                res.json({
                    errMsg: e.message,
                    success: false,
                });
            }
        });
    }
    startSpider(spiderName, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap } = global['app'];
            const spider = spiderMap[spiderName];
            try {
                yield spider.callStart();
                res.json({
                    success: true,
                    msg: '启动成功',
                });
            }
            catch (e) {
                res.json({
                    errMsg: e.message,
                    success: false,
                });
            }
        });
    }
};
__decorate([
    loon_1.Get(""),
    __param(0, loon_1.QueryParam('q')), __param(1, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpiderController.prototype, "getSpiders", null);
__decorate([
    loon_1.Get("/:spiderName"),
    __param(0, loon_1.PathParam('spiderName')), __param(1, loon_1.QueryParam('taskId')), __param(2, loon_1.Req()), __param(3, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SpiderController.prototype, "getSpider", null);
__decorate([
    loon_1.Post("/:spiderName/code"),
    __param(0, loon_1.PathParam('spiderName')), __param(1, loon_1.Req()), __param(2, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SpiderController.prototype, "updateSpiderCode", null);
__decorate([
    loon_1.Post("/:spiderName"),
    __param(0, loon_1.PathParam('spiderName')), __param(1, loon_1.Req()), __param(2, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SpiderController.prototype, "updateSpider", null);
__decorate([
    loon_1.Post("/:spiderName/debug"),
    __param(0, loon_1.PathParam('spiderName')), __param(1, loon_1.Req()), __param(2, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SpiderController.prototype, "debugSpider", null);
__decorate([
    loon_1.Post("/:spiderName/start"),
    __param(0, loon_1.PathParam('spiderName')), __param(1, loon_1.Req()), __param(2, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SpiderController.prototype, "startSpider", null);
SpiderController = __decorate([
    loon_1.RestController("/api/spiders")
], SpiderController);
exports.SpiderController = SpiderController;
//# sourceMappingURL=SpiderController.js.map