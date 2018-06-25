"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = require("./DB");
const Enums_1 = require("../Enums");
function getSpiderTableName(spiderName) {
    return spiderName.replace(/[A-Z]/g, (s, i) => (i === 0 ? '' : '_') + s.toLowerCase());
}
function insertTask(spiderName, task) {
    return __awaiter(this, void 0, void 0, function* () {
        // const { preTaskId, options, ...tsk } = task;
        const tsk = Object.assign({}, task, {
            options: JSON.stringify(task.options),
            status: Enums_1.default.taskStatus.active,
            scheduletime: (new Date()).getTime() / 1000,
            updatetime: (new Date()).getTime() / 1000,
        });
        const tableName = getSpiderTableName(spiderName);
        return DB_1.default.taskQuery(`INSERT INTO ${tableName} SET ?`, tsk);
    });
}
exports.insertTask = insertTask;
function updateTask(spiderName, task) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableName = getSpiderTableName(spiderName);
        const tsk = Object.assign({}, task, {
            updatetime: (new Date()).getTime() / 1000,
        });
        if (tsk.options && (typeof tsk.options) !== 'string') {
            tsk.options = JSON.stringify(tsk.options);
        }
        if (tsk.track && (typeof tsk.track) !== 'string') {
            tsk.track = JSON.stringify(tsk.track);
        }
        delete tsk.id;
        return DB_1.default.taskQuery(`UPDATE ${tableName} SET ? WHERE id=?`, [tsk, task.id]);
    });
}
exports.updateTask = updateTask;
function loadTasksForRun(spiderName) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableName = getSpiderTableName(spiderName);
        return DB_1.default.taskQuery(`SELECT * FROM ${tableName} WHERE status IN (?) ORDER BY scheduletime`, [[Enums_1.default.taskStatus.active, Enums_1.default.taskStatus.bad]]);
    });
}
exports.loadTasksForRun = loadTasksForRun;
function listTasks(spiderName, limit = '100', status, tags) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableName = getSpiderTableName(spiderName);
        const wheres = [];
        const values = [];
        if (status !== undefined && status !== '') {
            wheres.push('status IN (?)');
            values.push(status.split(/\s*,\s*/).map(a => Number.parseInt(a, 10)));
        }
        if (tags !== undefined && tags !== '') {
            wheres.push('tags like ?');
            values.push(tags);
        }
        values.push(Number.parseInt(limit, 10));
        const where = wheres.length === 0 ? '' : `WHERE ${wheres.join(' AND ')}`;
        const sql = `SELECT id,uri,status,tags,scheduletime,lastcrawltime,updatetime FROM ${tableName} ${where} ORDER BY scheduletime DESC,lastcrawltime DESC limit 0,?`;
        const sqlCount = `SELECT COUNT(1) total FROM ${tableName} ${where}`;
        const [{ total }] = yield DB_1.default.taskQuery(sqlCount, values);
        const list = yield DB_1.default.taskQuery(sql, values);
        return { list, total };
    });
}
exports.listTasks = listTasks;
function getTask(spiderName, taskId, fields = ['*']) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableName = getSpiderTableName(spiderName);
        const results = yield DB_1.default.taskQuery(`SELECT ${fields.join(',')} FROM ${tableName} WHERE id=?`, [taskId]);
        if (results.length === 1) {
            const task = results[0];
            if (task.track) {
                task.track = JSON.parse(task.track.toString());
            }
            if (task.options) {
                task.options = JSON.parse(task.options.toString());
            }
            return task;
        }
        return null;
    });
}
exports.getTask = getTask;
function deleteTask(spiderName, taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableName = getSpiderTableName(spiderName);
        const results = yield DB_1.default.taskQuery(`DELETE FROM ${tableName} WHERE id=?`, [taskId]);
        const affectedRows = results['affectedRows'];
        return affectedRows === 1;
    });
}
exports.deleteTask = deleteTask;
function countByStatus(spiderName) {
    return __awaiter(this, void 0, void 0, function* () {
        const counter = {};
        const tableName = getSpiderTableName(spiderName);
        const results = yield DB_1.default.taskQuery(`SELECT status,COUNT(1) cnt FROM ${tableName} GROUP BY status`);
        results.forEach(({ status, cnt }) => {
            counter[status] = cnt;
        });
        return counter;
    });
}
exports.countByStatus = countByStatus;
const TaskDB = {
    insertTask,
    updateTask,
    loadTasksForRun,
    listTasks,
    getTask,
    deleteTask,
    countByStatus,
};
exports.default = TaskDB;
//# sourceMappingURL=TaskDB.js.map