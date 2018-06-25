"use strict";
// import * as mysql from 'mysql/index';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_1 = require("../../../config/default");
const Bluebird = require("bluebird");
const mysql = require('promise-mysql');
const { host, port, user, password, databases, } = default_1.default.db;
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
const dataPool = mysql.createPool({
    connectionLimit: 10,
    host,
    port,
    user,
    password,
    database: databases.data,
    debug: false,
});
function getConnection(pool) {
    return __awaiter(this, void 0, void 0, function* () {
        return pool.getConnection().disposer(function (connection) {
            pool.releaseConnection(connection);
        });
    });
}
function query(sql, values, pool) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Bluebird.using(getConnection(pool), function (conn) {
            const rrr = conn.query(sql, values);
            return rrr;
        });
    });
}
/// ***************************************************************************************************************************************************
function dataQueryWithTransaction(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Bluebird.using(getConnection(dataPool), function (conn) {
            return fn(conn);
        });
    });
}
exports.dataQueryWithTransaction = dataQueryWithTransaction;
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        yield dataQueryWithTransaction((conn) => {
            conn.beginTransaction();
            conn.rollback();
            conn.commit();
        });
    });
}
/// ***************************************************************************************************************************************************
function taskQuery(sql, values) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield query(sql, values, taskPool);
    });
}
exports.taskQuery = taskQuery;
function spiderQuery(sql, values) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield query(sql, values, spiderPool);
    });
}
exports.spiderQuery = spiderQuery;
function dataQuery(sql, values) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield query(sql, values, dataPool);
    });
}
exports.dataQuery = dataQuery;
function resultQuery(sql, values) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield query(sql, values, resultPool);
    });
}
const DB = {
    dataQueryWithTransaction,
    taskQuery,
    spiderQuery,
    dataQuery,
    resultQuery,
    mysql,
};
exports.default = DB;
//# sourceMappingURL=DB.js.map