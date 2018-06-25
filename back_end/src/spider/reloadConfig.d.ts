import TimeBucket from '../utils/CounterByTime';
declare const reloadConfig: () => Promise<{
    spiderMap: {};
    timeBucket5m: TimeBucket;
    timeBucket1h: TimeBucket;
    timeBucket1d: TimeBucket;
    timeBucketAll: TimeBucket;
}>;
export default reloadConfig;
