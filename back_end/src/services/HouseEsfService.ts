import {dataQuery} from '../spider/database/DB';


export default class HouseEsfService {
    public async save(house) {
        const results = await dataQuery('SELECT * FROM house_esf WHERE id=?', house.id);
        if (results.length === 1) {
            const h = Object.assign({}, results[0], house, {update_at: new Date()});
            delete h.id;
            delete h.create_at;
            await dataQuery('UPDATE house_esf SET ? WHERE id=?', [h, house.id]);
        } else {
            await dataQuery('INSERT INTO house_esf SET ?', house);
        }
    }
}

