import * as url from 'url';
import BaseSpider, {Result, createCallbackBeforeCheck, Priority} from '../BaseSpider';
import {findString} from '../utils/StringUtils';
import FailedError from '../spider/errors/FailedError';

const host = 'http://km.58.com/ershoufang';
const startUri = `${host}/pn1/`;


const notFoundCheck = createCallbackBeforeCheck(async function (res) {
    const {body} = res;
    if (body.indexOf('你要找的页面不在这个星球上') > -1) {
        this.logger.warn('$$$$$$ 你要找的页面不在这个星球上 $$$$$$');
        throw new FailedError('你要找的页面不在这个星球上');
    }
});


export default class SpiderEsf58KM extends BaseSpider {
    defaultAge = '1h';

    protected async start(result: Result): Promise<void> {
        result.addFollow({
            uri: startUri,
            callback: this.cbList,
            tags: 'list',
        });
    }

    // @antiCheck
    private async cbList(res, saves, result: Result): Promise<void> {
        const {$} = res;
        const list = $('.house-list-wrap>li');
        const nextPageUri = $('.pager > a.next').attr('href');

        this.logger.info(`数量：${list.length}`);

        for (const item of list.get()) {
            const $item = this.cheerio(item);
            const uri = $item.find('.pic>a').attr('href');

            if (/58\.com\/ershoufang\/\w+\.shtml/.test(uri)) {
                result.addFollow({
                    priority: Priority._3(),
                    uri,
                    callback: this.cbDetail,
                    tags: 'detail',
                    age: '1w',
                });
            }
        }

        if (nextPageUri) {
            result.addFollow({uri: url.resolve(res.request.href, nextPageUri), callback: this.cbList, tags: 'list'});
        }
    }

    @notFoundCheck
    private async cbDetail(res, saves: object, result: Result): Promise<void> {
        const {$, request: req} = res;
        const url = req.href;
        const id = this.md5(url);
        const title = $('.house-title>h1').text();
        const house_id = findString(url, /(\d+)x\.shtml/);
        const total_price = findString($('.price').text(), /(\d+\.?\d*)/);
        const unit_price = findString($('.unit').text(), /(\d+\.?\d*)/);
        const room_cnt = findString($('.room>.main').text(), /(\d+)\s*室/);

        result.addData({
            $table: 'house_esf',
            id,
            url,
            title,
            house_id,
            total_price,
            unit_price,
            room_cnt,
        });
    }
}
