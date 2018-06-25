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
const Express = require("express");
let SpiderInfoController = class SpiderInfoController {
    getSpidersInfo(res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, } = global['app'];
            const infos = {};
            Object.keys(spiderMap).forEach((spiderName) => {
                const spider = spiderMap[spiderName];
                const counter = {};
                const info = {
                    counter,
                    nextCronDates: null,
                    queueSize: spider.crawler.queueSize,
                };
                infos[spiderName] = info;
                if (spider.cronJob) {
                    info.nextCronDates = spider.cronJob.nextDates(30).map(d => d.format('X'));
                }
                counter['5m'] = {
                    newly: timeBucket5m.get(`${spiderName}_newly`),
                    success: timeBucket5m.get(`${spiderName}_success`),
                    failed: timeBucket5m.get(`${spiderName}_failed`),
                    retry: timeBucket5m.get(`${spiderName}_retry`),
                };
                counter['1h'] = {
                    newly: timeBucket1h.get(`${spiderName}_newly`),
                    success: timeBucket1h.get(`${spiderName}_success`),
                    failed: timeBucket1h.get(`${spiderName}_failed`),
                    retry: timeBucket1h.get(`${spiderName}_retry`),
                };
                counter['1d'] = {
                    newly: timeBucket1d.get(`${spiderName}_newly`),
                    success: timeBucket1d.get(`${spiderName}_success`),
                    failed: timeBucket1d.get(`${spiderName}_failed`),
                    retry: timeBucket1d.get(`${spiderName}_retry`),
                };
                counter['all'] = {
                    newly: timeBucketAll.get(`${spiderName}_newly`),
                    success: timeBucketAll.get(`${spiderName}_success`),
                    failed: timeBucketAll.get(`${spiderName}_failed`),
                    retry: timeBucketAll.get(`${spiderName}_retry`),
                };
            });
            res.json(infos);
        });
    }
};
__decorate([
    loon_1.Get(""),
    __param(0, loon_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpiderInfoController.prototype, "getSpidersInfo", null);
SpiderInfoController = __decorate([
    loon_1.RestController("/api/spiderInfos")
], SpiderInfoController);
exports.SpiderInfoController = SpiderInfoController;
//# sourceMappingURL=SpiderInfoController.js.map