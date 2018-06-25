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
const jsonfile = require("jsonfile");
class TimeBucket {
    constructor(range, particle) {
        const l = range % particle;
        if (l) {
            range += (particle - l);
        }
        const bucket = [];
        this.bucket = bucket;
        this.range = range;
        this.particle = particle;
        this.size = (range / particle) + 1;
        for (let i = 0; i < this.size; i += 1) {
            bucket.push({});
        }
        this._start();
    }
    save() {
        return new Promise((resolve, reject) => {
            const thisObj = Object.assign({}, this);
            delete thisObj.filePath;
            jsonfile.writeFile(this.filePath, thisObj, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    load(filePath) {
        return new Promise((resolve, reject) => {
            jsonfile.readFile(filePath, (err, obj) => {
                if (err) {
                    reject(err);
                }
                else {
                    Object.assign(this, obj);
                    resolve();
                }
            });
        });
    }
    get(key, range) {
        if (range == null) {
            range = this.range;
        }
        if (range > this.range) {
            throw new Error(`range must less than ${this.range}`);
        }
        const now = this.now();
        const index = this._getParticleIndex(now);
        const fromIndex = this._getParticleIndex(now - range);
        let count = 0;
        for (var i = index, particle; i >= fromIndex && i >= 0; i--) {
            particle = this._getParticle(i);
            if (particle) {
                count += particle.data[key] || 0;
            }
        }
        return count;
    }
    put(key, value) {
        const now = this.now();
        const index = this._getParticleIndex(now);
        const particle = this._getParticle(index);
        if (particle.data[key]) {
            particle.data[key] += value;
        }
        else {
            particle.data[key] = value;
        }
        return this.save();
    }
    _start() {
        this.head = this.now();
    }
    now() {
        return new Date().getTime();
    }
    _getParticleIndex(current) {
        return Math.floor((current - this.head) / this.particle);
    }
    _getParticle(index) {
        const particle = this.bucket[index % this.size];
        if (particle.index !== index) {
            particle.index = index;
            particle.data = {};
        }
        return particle;
    }
    static newInstance(range, particle, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new TimeBucket(range, particle);
            instance.filePath = filePath;
            yield instance.load(filePath).catch(() => {
            });
            return instance;
        });
    }
}
exports.default = TimeBucket;
//# sourceMappingURL=CounterByTime.js.map