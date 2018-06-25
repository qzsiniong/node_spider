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
const loon_1 = require("loon");
const Joi = require("joi");
const Express = require("express");
const TaskDB_1 = require("../spider/database/TaskDB");
const Enums_1 = require("../spider/Enums");
let TaskController = class TaskController {
    getTasks(spiderName, limit, status, tags, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, } = global['app'];
            const { taskStatus } = Enums_1.default;
            const schema = Joi.object().keys({
                spiderName: Joi.string().required().valid(Object.keys(spiderMap)),
                limit: Joi.number().integer().min(1).max(1000),
                status: Joi.any().valid([`${taskStatus.success}`, `${taskStatus.failed}`, `${taskStatus.bad}`, `${taskStatus.active}`]),
                tags: Joi.string().allow(''),
            });
            const result = Joi.validate({ spiderName, limit, status, tags }, schema);
            if (result.error) {
                throw result.error;
            }
            const { list, total } = yield TaskDB_1.default.listTasks(spiderName, limit, status, tags);
            const counterByStatus = yield TaskDB_1.default.countByStatus(spiderName);
            res.json({ list, total, counterByStatus });
        });
    }
    getTask(spiderNameTaskId, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const [spiderName, taskId] = spiderNameTaskId.split(':');
            const task = yield TaskDB_1.default.getTask(spiderName, taskId);
            if (task && task.options && task.options.preTaskId) {
                task.preTask = yield TaskDB_1.default.getTask(spiderName, task.options.preTaskId, ['id', 'uri']);
            }
            if (task && task.track && task.track.process) {
                const { follows } = task.track.process;
                delete task.track.process.follows;
                task.follows = [];
                if (follows && follows.length > 0) {
                    const promises = follows.filter(follow => !!follow).map(follow => TaskDB_1.default.getTask(spiderName, follow, ['id', 'uri']));
                    const followTasks = yield Promise.all(promises);
                    task.follows.push(...followTasks.filter(followTask => !!followTask));
                }
            }
            res.json({ data: task });
        });
    }
    recrawl(spiderNameTaskId, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, } = global['app'];
            const [spiderName, taskId] = spiderNameTaskId.split(':');
            const task = yield TaskDB_1.default.getTask(spiderName, taskId, ['options']);
            yield spiderMap[spiderName].crawl(Object.assign({}, task.options, { age: 0 }));
            res.json({ success: true, msg: '设置重爬成功' });
        });
    }
    deleteTask(spiderNameTaskId, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const [spiderName, taskId] = spiderNameTaskId.split(':');
            const success = yield TaskDB_1.default.deleteTask(spiderName, taskId);
            const ret = {
                success,
                msg: undefined,
                errMsg: undefined,
            };
            if (success) {
                ret.msg = '删除任务成功';
            }
            else {
                ret.errMsg = '删除任务失败';
            }
            res.json(ret);
        });
    }
};
__decorate([
    loon_1.Get(""),
    __param(0, loon_1.QueryParam('spiderName')), __param(1, loon_1.QueryParam('limit')), __param(2, loon_1.QueryParam('status')), __param(3, loon_1.QueryParam('tags')), __param(4, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTasks", null);
__decorate([
    loon_1.Get("/:spiderNameTaskId"),
    __param(0, loon_1.PathParam("spiderNameTaskId")), __param(1, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTask", null);
__decorate([
    loon_1.Put("/:spiderNameTaskId/recrawl"),
    __param(0, loon_1.PathParam("spiderNameTaskId")), __param(1, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "recrawl", null);
__decorate([
    loon_1.Delete("/:spiderNameTaskId"),
    __param(0, loon_1.PathParam("spiderNameTaskId")), __param(1, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "deleteTask", null);
TaskController = __decorate([
    loon_1.RestController("/api/tasks")
], TaskController);
exports.TaskController = TaskController;
//# sourceMappingURL=TaskController.js.map