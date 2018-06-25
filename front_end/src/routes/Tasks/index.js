import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Timeline, Tag, Spin, Tooltip, Alert } from 'antd';
// import styles from './index.less';
import { ago, time2String } from '../../utils/timeUtils';

const CheckableTag = Tag.CheckableTag;

@connect(({ tasks, loading }) => ({
  tasks,
  loading: loading.models.tasks,
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      status: undefined,
    };
  }

  componentDidMount() {
    this.fetchTasks();
  }

  fetchTasks() {
    const { status } = this.state;
    const { dispatch, match: { params: { spiderName, limit } } } = this.props;
    dispatch({
      type: 'tasks/fetchTasks',
      payload: {
        spiderName,
        limit,
        status,
      },
    });
  }

  handleStatusChange(status, checked) {
    this.setState({ status: checked ? status : undefined }, () => this.fetchTasks())
  }

  renderItem(task) {
    const { match: { params: { spiderName } } } = this.props;
    const tags = task.tags ? task.tags.split(',') : [];
    const statusObj = {
      1: { title: 'active', icon: 'meh', color: '#428bca' },
      2: { title: 'success', icon: 'smile', color: '#5cb85c' },
      3: { title: 'failed', icon: 'frown', color: '#d9534f' },
      4: { title: 'bad', icon: 'frown', color: '#f0ad4e' },
    }[task.status];

    return (
      <Timeline.Item key={task.id}>
        <Tag color={statusObj.color}>{statusObj.title}</Tag>
        <Link target="_blank" to={`/debug/${spiderName}/${task.id}`} style={{ color: '#f0ad4e', paddingRight: 5 }}>{spiderName}</Link>
        &gt;
        <Link target="_blank" to={`/task/${spiderName}/${task.id}`} style={{ color: '#428bca', padding: '0 5px' }}>{task.uri}</Link>

        {
          tags.map(tag => <Tag key={tag}>{tag}</Tag>)
        }

        <Tooltip placement="top" title={time2String(task.scheduletime, 'HH:mm:ss:SSS')}>
          <Tag color="purple">Create by:{ago(task.scheduletime)}</Tag>
        </Tooltip>

        {
          task.lastcrawltime ?
            <Tooltip placement="top" title={time2String(task.lastcrawltime, 'HH:mm:ss:SSS')}>
              <Tag color="cyan">Last crawl by:{ago(task.lastcrawltime)}</Tag>
            </Tooltip> : null
        }
      </Timeline.Item>
    );
  }

  render() {
    const { status } = this.state;
    const { tasks: { list, total, counterByStatus }, loading } = this.props;
    return (
      <Spin spinning={loading} wrapperClassName="spin-full">
        <div>
          {
            [[1, 'active'], [2, 'success'], [3, 'failed'], [4, 'bad']].map((([s, text]) => {
              return (
                <CheckableTag
                  key={s}
                  checked={status === s}
                  onChange={this.handleStatusChange.bind(this, s)}
                >
                  {text} ({counterByStatus[s] || 0})
                </CheckableTag>
              )
            }))
          }
        </div>

        {/*<Alert message={`共${total}个任务`} type="info" showIcon/>*/}
        <div style={{ padding: '20px 15px' }}>
          <Timeline>
            {
              list.map((task) => this.renderItem(task))
            }
          </Timeline>
        </div>
      </Spin>
    );
  }
}
