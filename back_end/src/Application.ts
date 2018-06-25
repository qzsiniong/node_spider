import path = require("path");


import {ApplicationLoader, ApplicationSettings} from "loon";
import {getAppLogger} from "./utils/LoggerUtils";
import reloadConfig from "./spider/reloadConfig";
import {unlinkIfExists} from "./utils/Utils";

const appLogger = getAppLogger();


@ApplicationSettings({rootDir: `${__dirname}/../`, port: 3737})
export class Application extends ApplicationLoader {

    public spiderMap;
    public timeBucket5m;
    public timeBucket1h;
    public timeBucket1d;
    public timeBucketAll;

    constructor(){
        super();
    }

    public async $beforeInit() {
        const {
            spiderMap, timeBucket5m, timeBucket1h, timeBucket1d, timeBucketAll,
        } = await reloadConfig();
        this.spiderMap = spiderMap;
        this.timeBucket5m = timeBucket5m;
        this.timeBucket1h = timeBucket1h;
        this.timeBucket1d = timeBucket1d;
        this.timeBucketAll = timeBucketAll;

        // this.server.set('view engine', 'ejs11');
        // this.server.set('views', `${this.rootDir}/view`);
        this.server.use(require('serve-static')(this.publicDir));

        await unlinkIfExists(`${__dirname}/../all.d.ts`);
        require('dts-generator').default({
            externs: [],
            name: '@',
            project: `${__dirname}/../`,
            out: 'all.d.ts' ,
            "exclude": [
                "**/*.d.ts"
            ]
        });

    }

    public $afterInit() {
        this.server.get('/*', async (req, res, next) => {
            const { url } = req;
            if(/^\/api\//.test(url)){
                next();
            }else{
                res.sendFile(path.resolve(__dirname, `${this.publicDir}/index.html`));
            }
        });
    }
}



