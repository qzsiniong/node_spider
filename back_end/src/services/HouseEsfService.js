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
const DB_1 = require("../spider/database/DB");
class HouseEsfService {
    save(house) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield DB_1.dataQuery('SELECT * FROM house_esf WHERE id=?', house.id);
            if (results.length === 1) {
                const h = Object.assign({}, results[0], house, { update_at: new Date() });
                delete h.id;
                delete h.create_at;
                yield DB_1.dataQuery('UPDATE house_esf SET ? WHERE id=?', [h, house.id]);
            }
            else {
                yield DB_1.dataQuery('INSERT INTO house_esf SET ?', house);
            }
        });
    }
}
exports.default = HouseEsfService;
//# sourceMappingURL=HouseEsfService.js.map