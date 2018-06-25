const Config = {
    logLevel: 'debug',
    apiPath: '/api',
    spidersPath: `${__dirname}/../src/spiders/`,
    servicesPath: `${__dirname}/../src/services/`,
    db: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '123456',
        databases: {
            spider: 'ns_spider',
            task: 'ns_task',
            result: 'ns_result',
            data: 'ns_data',
        },
    },
};

export default Config;
