import {IMiddleware, Middleware, Next} from "loon";
import * as Express from 'express';

@Middleware({order: 0})
class ELKMiddleware implements IMiddleware {

    public use(@Next() next: Express.NextFunction) {
        // start tracking
        next()
        // end tracking
        // send to elk
    }
}
