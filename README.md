# node_spider

## 下载项目
```
git clone https://github.com/qzsiniong/node_spider.git

cd node_spider/back_end/
yarn
```

## 配置
修改 back_end/config/default-example.ts => default.ts
修改 config/default.ts 中的db配置

## 数据库准备
新建database
```sql
CREATE DATABASE ns_spider DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
CREATE DATABASE ns_task DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
CREATE DATABASE ns_data DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
```

创建表
```sql
CREATE TABLE ns_spider.spiders
(
  name       VARCHAR(64)   NOT NULL
    PRIMARY KEY,
  groups     VARCHAR(64)   NULL,
  status     VARCHAR(16)   NULL,
  crontime   VARCHAR(100)  NULL,
  comments   VARCHAR(1024) NULL,
  rate       INT           NULL,
  updatetime DOUBLE(16, 4) NULL
);

```



## 启动
```
npm run dev
```

## 访问WEB控制台
http://localhost:3737
