import {Err, ErrorMiddleware, IMiddleware, Res} from "loon";
import * as Express from 'express';

@ErrorMiddleware()
class ExceptionHandler implements IMiddleware {

    public use(@Err() err: any, @Res() res: Express.Response) {
        console.log(err);
        res.sendStatus(400);
    }
}
