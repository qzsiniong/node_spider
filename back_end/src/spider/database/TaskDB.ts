import DB from './DB';
import Enums from '../Enums';

function getSpiderTableName(spiderName) {
    return spiderName.replace(/[A-Z]/g, (s, i) => (i === 0 ? '' : '_') + s.toLowerCase());
}


export async function insertTask(spiderName, task) {
    // const { preTaskId, options, ...tsk } = task;
    const tsk = Object.assign({}, task, {
        options: JSON.stringify(task.options),
        status: Enums.taskStatus.active,
        scheduletime: (new Date()).getTime() / 1000,
        updatetime: (new Date()).getTime() / 1000,
    });
    const tableName = getSpiderTableName(spiderName);
    return DB.taskQuery(`INSERT INTO ${tableName} SET ?`, tsk);
}

export async function updateTask(spiderName, task) {
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
    return DB.taskQuery(`UPDATE ${tableName} SET ? WHERE id=?`, [tsk, task.id]);
}

export async function loadTasksForRun(spiderName) {
    const tableName = getSpiderTableName(spiderName);
    return DB.taskQuery(`SELECT * FROM ${tableName} WHERE status IN (?) ORDER BY scheduletime`, [[Enums.taskStatus.active, Enums.taskStatus.bad]]);
}

export async function listTasks(spiderName, limit = '100', status, tags) {
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
    const [{total}] = await DB.taskQuery(sqlCount, values);
    const list = await DB.taskQuery(sql, values);

    return {list, total};
}

export async function getTask(spiderName, taskId, fields = ['*']) {
    const tableName = getSpiderTableName(spiderName);
    const results = await DB.taskQuery(`SELECT ${fields.join(',')} FROM ${tableName} WHERE id=?`, [taskId]);
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
}

export async function deleteTask(spiderName, taskId) {
    const tableName = getSpiderTableName(spiderName);
    const results = await DB.taskQuery(`DELETE FROM ${tableName} WHERE id=?`, [taskId]);
    const affectedRows = results['affectedRows'];

    return affectedRows === 1;
}


export async function countByStatus(spiderName) {
    const counter = {};
    const tableName = getSpiderTableName(spiderName);
    const results = await DB.taskQuery(`SELECT status,COUNT(1) cnt FROM ${tableName} GROUP BY status`);
    results.forEach(({status, cnt}) => {
        counter[status] = cnt;
    });
    return counter;
}

const TaskDB = {
    insertTask,
    updateTask,
    loadTasksForRun,
    listTasks,
    getTask,
    deleteTask,
    countByStatus,
};

export default TaskDB;
