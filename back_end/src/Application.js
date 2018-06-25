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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const loon_1 = require("loon");
const LoggerUtils_1 = require("./utils/LoggerUtils");
const reloadConfig_1 = require("./spider/reloadConfig");
const Utils_1 = require("./utils/Utils");
const appLogger = LoggerUtils_1.getAppLogger();
let Application = class Application extends loon_1.ApplicationLoader {
    constructor() {
        super();
    }
    $beforeInit() {
        return __awaiter(this, void 0, void 0, function* () {
            const { spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll, } = yield reloadConfig_1.default();
            this.spiderMap = spiderMap;
            this.timeBucket5m = timeBucket5m;
            this.timeBucket1h = timeBucket1h;
            this.timeBucket1d = timeBucket1d;
            this.timeBucketAll = timeBucketAll;
            // this.server.set('view engine', 'ejs11');
            // this.server.set('views', `${this.rootDir}/view`);
            this.server.use(require('serve-static')(this.publicDir));
            yield Utils_1.unlinkIfExists(`${__dirname}/../all.d.ts`);
            require('dts-generator').default({
                externs: [],
                name: '@',
                project: `${__dirname}/../`,
                out: 'all.d.ts',
                "exclude": [
                    "**/*.d.ts"
                ]
            });
        });
    }
    $afterInit() {
        this.server.get('/*', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { url } = req;
            if (/^\/api\//.test(url)) {
                next();
            }
            else {
                res.sendFile(path.resolve(__dirname, `${this.publicDir}/index.html`));
            }
        }));
    }
};
Application = __decorate([
    loon_1.ApplicationSettings({ rootDir: `${__dirname}/../`, port: 3737 }),
    __metadata("design:paramtypes", [])
], Application);
exports.Application = Application;
//# sourceMappingURL=Application.js.map