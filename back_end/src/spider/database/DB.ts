// import * as mysql from 'mysql/index';

import Config from '../../../config/default';
import * as Bluebird from "bluebird";
import {Pool, PoolConnection} from "promise-mysql";


const mysql = require('promise-mysql');

const {
    host, port, user, password, databases,
} = Config.db;

const spiderPool = mysql.createPool({
    connectionLimit: 10,
    host,
    port,
    user,
    password,
    database: databases.spider,
});
const taskPool = mysql.createPool({
    connectionLimit: 10,
    host,
    port,
    user,
    password,
    database: databases.task,
});
const resultPool = mysql.createPool({
    connectionLimit: 10,
    host,
    port,
    user,
    password,
    database: databases.result,
});
const dataPool: Pool = mysql.createPool({
    connectionLimit: 10,
    host,
    port,
    user,
    password,
    database: databases.data,
    debug: false,
});


async function getConnection(pool: Pool) {
    return pool.getConnection().disposer(function (connection) {
        pool.releaseConnection(connection);
    });
}


async function query(sql, values, pool) {
    return await Bluebird.using(getConnection(pool), function (conn: PoolConnection) {
        const rrr = conn.query(sql, values);
        return rrr;
    });
}


/// ***************************************************************************************************************************************************
export async function dataQueryWithTransaction(fn: (conn: PoolConnection) => any) {
    return await Bluebird.using(getConnection(dataPool), function (conn: PoolConnection) {
        return fn(conn);
    });
}

async function test() {
    await dataQueryWithTransaction((conn) => {
        conn.beginTransaction();
        conn.rollback();
        conn.commit();
    })
}

/// ***************************************************************************************************************************************************


export async function taskQuery(sql, values?) {
    return await query(sql, values, taskPool);
}

export async function spiderQuery(sql, values?) {
    return await query(sql, values, spiderPool);
}

export async function dataQuery(sql: string, values?: any) {
    return await query(sql, values, dataPool);
}

async function resultQuery(sql, values) {
    return await query(sql, values, resultPool);
}


const DB = {
    dataQueryWithTransaction,
    taskQuery,
    spiderQuery,
    dataQuery,
    resultQuery,
    mysql,
};

export default DB;
