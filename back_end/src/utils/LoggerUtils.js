"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js = require("log4js");
const LOG_LEVEL = 'debug';
const log4jsConf = {
    appenders: {
        stdout: { type: 'stdout' },
        app: {
            type: 'dateFile',
            filename: 'logs/',
            pattern: 'app-yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            layout: {
                type: 'pattern',
                pattern: '[%d] [%p] - %m',
            },
        },
        request: {
            type: 'dateFile',
            filename: 'logs/',
            pattern: 'request-yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            layout: {
                type: 'pattern',
                pattern: '[%d] [%p] - %m',
            },
        },
    },
    categories: {
        default: { appenders: ['stdout', 'app'], level: LOG_LEVEL },
        app: { appenders: ['stdout', 'app'], level: LOG_LEVEL },
        request: { appenders: ['stdout', 'request'], level: LOG_LEVEL },
    },
};
log4js.configure(log4jsConf);
const appLogger = log4js.getLogger('app');
const requestLogger = log4js.getLogger('request');
const spiderLoggers = {};
function getAppLogger() {
    return appLogger;
}
exports.getAppLogger = getAppLogger;
function getRequestLogger() {
    return requestLogger;
}
exports.getRequestLogger = getRequestLogger;
function getSpiderLogger(spiderKey) {
    let spiderLogger = spiderLoggers[spiderKey];
    if (!spiderLogger) {
        const loggerName = `spider_${spiderKey}`;
        log4jsConf.appenders[loggerName] = {
            type: 'dateFile',
            filename: `logs/spider_${spiderKey}/`,
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            layout: {
                type: 'pattern',
                pattern: '[%d] [%p] - %m',
            },
        };
        log4jsConf.categories[loggerName] = { appenders: ['stdout', loggerName], level: LOG_LEVEL };
        log4js.configure(log4jsConf);
        spiderLogger = log4js.getLogger(loggerName);
        spiderLoggers[spiderKey] = spiderLogger;
    }
    return spiderLogger;
}
exports.getSpiderLogger = getSpiderLogger;
//# sourceMappingURL=LoggerUtils.js.map