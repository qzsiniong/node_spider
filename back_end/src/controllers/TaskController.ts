import {Get, Res, RestController, Inject, QueryParam, Req, Post, PathParam, Put, Delete} from "loon";
import {CronJob} from 'cron';
import * as Joi from 'joi';
import * as Express from 'express';
import fs = require("fs");
import path = require("path");


import TaskDB from "../spider/database/TaskDB";
import Enums from "../spider/Enums";

@RestController("/api/tasks")
export class TaskController {

    @Get("")
    public async getTasks(@QueryParam('spiderName') spiderName: string, @QueryParam('limit') limit: string, @QueryParam('status') status: string, @QueryParam('tags') tags: string, @Res() res: Express.Response) {
        const {
            spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
        } = global['app'];
        const {taskStatus} = Enums;
        const schema = Joi.object().keys({
            spiderName: Joi.string().required().valid(Object.keys(spiderMap)),
            limit: Joi.number().integer().min(1).max(1000),
            status: Joi.any().valid([`${taskStatus.success}`, `${taskStatus.failed}`, `${taskStatus.bad}`, `${taskStatus.active}`]),
            tags: Joi.string().allow(''),
        });

        const result = Joi.validate({spiderName, limit, status, tags}, schema);

        if (result.error) {
            throw result.error;
        }
        const {list, total} = await TaskDB.listTasks(spiderName, limit, status, tags);
        const counterByStatus = await TaskDB.countByStatus(spiderName);
        res.json({list, total, counterByStatus});
    }

    @Get("/:spiderNameTaskId")
    public async getTask(@PathParam("spiderNameTaskId") spiderNameTaskId: string, @Res() res: Express.Response) {
        const [spiderName, taskId] = spiderNameTaskId.split(':');
        const task = await TaskDB.getTask(spiderName, taskId);

        if (task && task.options && task.options.preTaskId) {
            task.preTask = await TaskDB.getTask(spiderName, task.options.preTaskId, ['id', 'uri']);
        }

        if (task && task.track && task.track.process) {
            const {follows} = task.track.process;
            delete task.track.process.follows;
            task.follows = [];

            if (follows && follows.length > 0) {
                const promises = follows.filter(follow => !!follow).map(follow => TaskDB.getTask(spiderName, follow, ['id', 'uri']));
                const followTasks = await Promise.all(promises);
                task.follows.push(...followTasks.filter(followTask => !!followTask));
            }
        }

        res.json({data: task});
    }

    @Put("/:spiderNameTaskId/recrawl")
    public async recrawl(@PathParam("spiderNameTaskId") spiderNameTaskId: string, @Res() res: Express.Response) {
        const {
            spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
        } = global['app'];
        const [spiderName, taskId] = spiderNameTaskId.split(':');
        const task = await TaskDB.getTask(spiderName, taskId, ['options']);
        await spiderMap[spiderName].crawl(Object.assign({}, task.options, {age: 0}));

        res.json({success: true, msg: '设置重爬成功'});
    }

    @Delete("/:spiderNameTaskId")
    public async deleteTask(@PathParam("spiderNameTaskId") spiderNameTaskId: string, @Res() res: Express.Response) {
        const [spiderName, taskId] = spiderNameTaskId.split(':');


        const success = await TaskDB.deleteTask(spiderName, taskId);
        const ret = {
            success,
            msg: undefined,
            errMsg: undefined,
        };
        if (success) {
            ret.msg = '删除任务成功';
        } else {
            ret.errMsg = '删除任务失败';
        }

        res.json(ret);
    }
}
