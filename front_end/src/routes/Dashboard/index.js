import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Select, Popover, Divider, Row, Col, Tag, Badge, Popconfirm } from 'antd';

import timeLen from 'time-len';

import StandardTable from 'components/StandardTable';
import ProcessBar from './ProcessBar';
// import styles from './index.less';

import RatePopover from './RatePopover';
import CronTimeEditor from './CronTimeEditor';
import { time2String } from "../../utils/timeUtils";


@connect(({ spiders, spiderInfos, loading }) => ({
  spiders,
  spiderInfos,
  loading: loading.models.spiders,
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.dispatch({
      type: 'spiders/fetchSpiders',
    });
    this.counter();
    this.timer = setInterval(() => {
      this.counter();
    }, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  onChangeStatus(spider, status) {
    this.props.dispatch({
      type: 'spiders/update',
      payload: {
        spiderName: spider.name,
        name: 'status',
        value: status,
      },
    });
  }

  counter() {
    this.props.dispatch({
      type: 'spiderInfos/info',
    });
  }

  startSpider(spiderName) {
    this.props.dispatch({
      type: 'spiders/startSpider',
      payload: {
        spiderName,
      },
    });
  }

  render() {
    const { spiders: { list }, spiderInfos: { info }, loading } = this.props;
    const selectedRows = [];
    const data = { list, pagination: {} };

    const columns = [
      {
        title: '分类',
        dataIndex: 'groups',
      },
      {
        title: '名称',
        dataIndex: 'name',
        render: (val) => {
          return <Link to={`/debug/${val}`} target="_blank">{val}</Link>
        }
      },
      {
        title: '时间配置',
        dataIndex: 'crontime',
        render: (val, spider) => {
          let tag = <Tag>NULL</Tag>;
          if (!!val) {
            tag = <Tag>{val}</Tag>;
          }

          return (
            <Popover
              content={<CronTimeEditor spiderName={spider.name} value={val}
                                       onClose={() => this.setState({ [`visibleCronTime_${spider.name}`]: false })}/>}
              trigger="click"
              visible={this.state[`visibleCronTime_${spider.name}`]}
              onVisibleChange={(visible) => this.setState({ [`visibleCronTime_${spider.name}`]: visible })}
            >
              {tag}
            </Popover>
          )
        }
      },
      {
        title: '下次启动时间',
        // width: 250,
        render: (_, spider) => {
          const nextCronDates = ((info[spider.name] || {}).nextCronDates) || [];
          const len = nextCronDates.length;
          if (len === 0) {
            return null;
          }
          if (len === 1) {
            return (
              <span>{time2String(nextCronDates[0])}</span>
            );
          }
          const tips = (
            <div>
              {
                new Array(Math.round(len / 2)).fill(1).map((_, idx) => {
                  const idx0 = idx + 1;
                  const idx1 = idx0 + Math.round(len / 2);
                  const d0 = nextCronDates[idx0 - 1];
                  const d1 = nextCronDates[idx1 - 1];
                  return (
                    <Row gutter={16} key={idx}>
                      <Col span={12}>
                        <Badge count={idx0} style={{
                          width: 30,
                          backgroundColor: '#fff',
                          color: '#999',
                          boxShadow: '0 0 0 1px #d9d9d9 inset'
                        }}/>
                        <Badge count={time2String(d0)} style={{
                          backgroundColor: '#fff',
                          color: '#999',
                          boxShadow: '0 0 0 1px #d9d9d9 inset'
                        }}/>
                      </Col>
                      <Col span={12}>
                        <Badge count={idx1} style={{
                          width: 30,
                          backgroundColor: '#fff',
                          color: '#999',
                          boxShadow: '0 0 0 1px #d9d9d9 inset'
                        }}/>
                        <Badge count={time2String(d1)} style={{
                          backgroundColor: '#fff',
                          color: '#999',
                          boxShadow: '0 0 0 1px #d9d9d9 inset'
                        }}/>
                      </Col>
                    </Row>
                  );
                })
              }
            </div>
          );
          return (
            <Popover content={tips} title="计划启动时间">
              <span>{time2String(nextCronDates[0])}</span>
            </Popover>
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        sorter: true,
        align: 'right',
        render: (val, spider) => {
          return (
            <Select defaultValue={val} style={{ width: 120 }} onChange={this.onChangeStatus.bind(this, spider)}>
              <Select.Option value="todo">TODO</Select.Option>
              <Select.Option value="running">RUNNING</Select.Option>
              <Select.Option value="stop">STOP</Select.Option>
              <Select.Option value="checking">CHECKING</Select.Option>
            </Select>
          );
        },
      },
      {
        title: '爬取间隔',
        dataIndex: 'rate',
        render: (val, spider) => {
          return (
            <Popover
              trigger="click"
              visible={this.state[`visible_rate_${spider.name}`]}
              onVisibleChange={(visible) => this.setState({ [`visible_rate_${spider.name}`]: visible })}
              content={<RatePopover spiderName={spider.name} value={val}
                                    onClose={() => this.setState({ [`visible_rate_${spider.name}`]: false })}/>}
            >
              <Tag>
                {/*<NumberFormat value={val} displayType={'text'} thousandSeparator={true} suffix={' ms'}/>*/}
                {timeLen(val, timeLen.unit.zh)}
              </Tag>
            </Popover>
          );
        },
      },
      {
        title: '任务数',
        render: (_, spider) => {
          const queueSize = (info[spider.name] || {}).queueSize || 0;
          return (
            <span>{queueSize}</span>
          );
        },
      },
      {
        title: '任务统计',
        // width: 250,
        render: (_, spider) => {
          const c = (info[spider.name] || {}).counter || {};
          return (
            <Row>
              <Col span={6}>
                <ProcessBar label="5m" data={c['5m']}/>
              </Col>
              <Col span={6}>
                <ProcessBar label="1h" data={c['1h']}/>
              </Col>
              <Col span={6}>
                <ProcessBar label="1d" data={c['1d']}/>
              </Col>
              <Col span={6}>
                <ProcessBar label="all" data={c.all}/>
              </Col>
            </Row>
          );
        },
      },
      {
        title: '操作',
        render: (_, spider) => {
          const queueSize = (info[spider.name] || {}).queueSize || 0;
          return (
            <Fragment>
              <Link to={`/tasks/${spider.name}`} target="_blank">近期任务</Link>
              <Divider type="vertical"/>
              <Popconfirm title="确定要手动启动Spider吗？" okText="是的" cancelText="点错了"
                          onConfirm={this.startSpider.bind(this, spider.name)}>
                <a disabled={spider.status !== 'running' || queueSize > 0}>START</a>
              </Popconfirm>
            </Fragment>
          );
        },
      },
    ];

    return (
      <Fragment>
        <StandardTable
          rowKey="name"
          selectedRows={selectedRows}
          loading={loading}
          data={data}
          columns={columns}
          onSelectRow={this.handleSelectRows}
          onChange={this.handleStandardTableChange}
        />
      </Fragment>
    );
  }
}
