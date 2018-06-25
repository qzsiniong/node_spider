export default class TimeBucket {
    private bucket;
    private range;
    private particle;
    private size;
    private head;
    private filePath;
    constructor(range: any, particle: any);
    save(): Promise<{}>;
    load(filePath: any): Promise<{}>;
    get(key: any, range: any): number;
    put(key: any, value: any): Promise<{}>;
    private _start();
    private now();
    private _getParticleIndex(current);
    private _getParticle(index);
    static newInstance(range: any, particle: any, filePath: any): Promise<TimeBucket>;
}
