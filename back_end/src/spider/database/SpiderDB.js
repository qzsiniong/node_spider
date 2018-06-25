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
function getSpider(spiderName) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield DB_1.default.spiderQuery('SELECT * FROM spiders WHERE name=?', [spiderName]);
        return results.length > 0 ? results[0] : null;
    });
}
exports.getSpider = getSpider;
function insertSpider(spider) {
    return __awaiter(this, void 0, void 0, function* () {
        return DB_1.default.spiderQuery('INSERT INTO spiders SET ?', {
            name: spider.name,
            groups: spider.groups,
            status: Enums_1.default.spiderStatus.running,
            comments: spider.comments,
            rate: 3000,
            updatetime: (new Date()).getTime() / 1000,
        });
    });
}
exports.insertSpider = insertSpider;
function updateSpider(spider) {
    return __awaiter(this, void 0, void 0, function* () {
        const spd = Object.assign({}, spider, { updatetime: (new Date()).getTime() / 1000 });
        delete spd.name;
        return DB_1.default.spiderQuery('UPDATE spiders SET ? WHERE name=?', [spd, spider.name]);
    });
}
exports.updateSpider = updateSpider;
function listSpiders() {
    return __awaiter(this, void 0, void 0, function* () {
        return DB_1.default.spiderQuery('SELECT * FROM spiders ORDER BY groups,name ');
    });
}
exports.listSpiders = listSpiders;
const SpiderDB = {
    getSpider,
    insertSpider,
    updateSpider,
    listSpiders,
};
exports.default = SpiderDB;
//# sourceMappingURL=SpiderDB.js.map