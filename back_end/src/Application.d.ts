import { ApplicationLoader } from "loon";
export declare class Application extends ApplicationLoader {
    spiderMap: any;
    timeBucket5m: any;
    timeBucket1h: any;
    timeBucket1d: any;
    timeBucketAll: any;
    constructor();
    $beforeInit(): Promise<void>;
    $afterInit(): void;
}
