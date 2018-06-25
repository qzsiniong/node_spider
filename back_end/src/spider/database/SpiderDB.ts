import DB from './DB';
import Enums from '../Enums';
import {FieldInfo} from "mysql";


export async function getSpider(spiderName) {
    const results = await DB.spiderQuery('SELECT * FROM spiders WHERE name=?', [spiderName]);
    return results.length > 0 ? results[0] : null;
}

export async function insertSpider(spider){
    return DB.spiderQuery('INSERT INTO spiders SET ?', {
        name: spider.name,
        groups: spider.groups,
        status: Enums.spiderStatus.running,
        comments: spider.comments,
        rate: 3000,
        updatetime: (new Date()).getTime() / 1000,
    });
}

export async function updateSpider(spider) {
    const spd = Object.assign({}, spider, {updatetime: (new Date()).getTime() / 1000});
    delete spd.name;
    return DB.spiderQuery('UPDATE spiders SET ? WHERE name=?', [spd, spider.name]);
}

export async function listSpiders() {
    return DB.spiderQuery('SELECT * FROM spiders ORDER BY groups,name ');
}

const SpiderDB = {
    getSpider,
    insertSpider,
    updateSpider,
    listSpiders,
};

export default SpiderDB;
