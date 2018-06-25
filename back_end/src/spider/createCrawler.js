"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Crawler = require("crawler");
const defaultOpts = {
    // the minimum time gap between two tasks.
    rateLimit: 3000,
    // the maximum number of tasks that can be running at the same time.
    maxConnections: 10,
    rotateUA: true,
    userAgent: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
    ],
    preRequest(options, done) {
        // 'options' here is not the 'options' you pass to 'c.queue',
        // instead, it's the options that is going to be passed to 'request' module
        // when done is called, the request will start
        done();
    },
};
const createCrawler = (opts) => {
    const opts_ = Object.assign({}, defaultOpts, opts);
    const crawler = new Crawler(opts_);
    return crawler;
};
exports.default = createCrawler;
//# sourceMappingURL=createCrawler.js.map