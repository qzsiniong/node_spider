import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Tag, Spin, Tooltip, Modal, Button, Divider } from 'antd';
import ReactJson from 'react-json-view'
import $ from 'jquery';

import styles from './index.less';
import { ago, time2String } from '../../utils/timeUtils';


@connect(({ tasks, loading }) => ({
  tasks,
  loading: loading.models.tasks,
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visibleBodyModal: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { taskId: nextTaskId, spiderName: nextSpiderName } = nextProps.match.params;
    const { taskId, spiderName } = this.props.match.params;
    if (nextTaskId !== taskId || nextSpiderName !== spiderName) {
      this.fetchTask(nextSpiderName, nextTaskId);
    }
  }

  componentDidMount() {
    const { match: { params: { spiderName, taskId } } } = this.props;
    this.fetchTask(spiderName, taskId);
  }

  fetchTask(spiderName, taskId) {
    const { dispatch } = this.props;
    dispatch({
      type: 'tasks/fetchTask',
      payload: {
        spiderName,
        taskId,
      },
    });
  }

  async recrawl() {
    const { dispatch, match: { params: { spiderName, taskId } } } = this.props;
    const { success } = await dispatch({
      type: 'tasks/recrawl',
      payload: {
        spiderName,
        taskId,
      },
    });
    if(success){
      this.fetchTask(spiderName, taskId);
    }
  }

  async deleteTask() {
    const { dispatch, match: { params: { spiderName, taskId } } } = this.props;
    const { success } = await dispatch({
      type: 'tasks/del',
      payload: {
        spiderName,
        taskId,
      },
    });
    if(success){
      this.fetchTask(spiderName, taskId);
    }
  }

  renderItem(task) {
    const { match: { params: { spiderName } } } = this.props;
    const statusObj = {
      1: { title: 'active', icon: 'meh', color: '#428bca' },
      2: { title: 'success', icon: 'smile', color: '#5cb85c' },
      3: { title: 'failed', icon: 'frown', color: '#d9534f' },
      4: { title: 'bad', icon: 'frown', color: '#f0ad4e' },
    }[task.status];

    return (
      <div className={styles.taskBaseInfo}>
        <Tag color={statusObj.color}>{statusObj.title}</Tag>
        <Link to={`/debug/${spiderName}/${task.id}`} style={{ color: '#f0ad4e', paddingRight: 5 }}>{spiderName}</Link>
        &gt;
        <a href={task.uri} target="_blank" style={{ color: '#428bca', padding: '0 5px' }}>{task.uri}</a>
        <Tooltip placement="top" title={time2String(task.scheduletime, 'HH:mm:ss:SSS')}>
          <Tag color="purple">Create by:{ago(task.scheduletime)}</Tag>
        </Tooltip>

        {
          task.lastcrawltime ?
            <Tooltip placement="top" title={time2String(task.lastcrawltime, 'HH:mm:ss:SSS')}>
              <Tag color="cyan">Last crawl by:{ago(task.lastcrawltime)}</Tag>
            </Tooltip> : null
        }

        {
          task.status === 3 && <Button type="primary" icon="retweet" onClick={::this.recrawl}>recrawl</Button>
        }

        {
          task.status === 3 && <Button type="danger" icon="delete" onClick={::this.deleteTask}>DELETE</Button>
        }
      </div>
    );
  }

  render_html(html, base_url, block_script = true, block_iframe = true) {
    if (html === undefined) {
      html = '';
    }
    let dom = (new DOMParser()).parseFromString(html, "text/html");

    $(dom).find('base').remove();
    $(dom).find('head').prepend('<base>');
    $(dom).find('base').attr('href', base_url);

    if (block_script) {
      $(dom).find('script').attr('type', 'text/plain');
    }
    if (block_iframe) {
      $(dom).find('iframe[src]').each((i, e) => {
        e = $(e);
        e.attr('__src', e.attr('src'))
        e.attr('src', encodeURI('data:text/html;,<h1>iframe blocked</h1>'));
      });
    }

    return dom.documentElement.innerHTML;
  }

  showFetchBodyModal() {
    const { tasks: { task } } = this.props;
    const bodyHtml = this.render_html(task.body, task.uri);

    const ifr = encodeURI(`data:text/html;,${bodyHtml}`);
    Modal.info({
      title: task.uri,
      content: (
        <iframe src={ifr} width="100%" height="500" title="fetch_body_iframe"/>
      ),
      width: '100%',
      maskClosable: true,
      onOk() {
      },
    });
  }

  renderTask(task) {
    const { match: { params: { spiderName } } } = this.props;
    // const { visibleBodyModal } = this.state;
    if (!task) {
      return;
    }

    // const bodyHtml = this.render_html(task.body, task.uri);

    // const ifr = encodeURI(`data:text/html;,${bodyHtml}`);
    return (
      <div>
        {task ? this.renderItem(task) : null}

        <dl className={styles.taskDetail}>
          <dt className={styles.itemTitle}>taskid</dt>
          <dd className={styles.itemContent}>{task.id}</dd>
          <dt className={styles.itemTitle}>scheduletime</dt>
          <dd className={styles.itemContent}>{time2String(task.scheduletime)} ({ago(task.scheduletime)})</dd>
          <dt className={styles.itemTitle}>lastcrawltime</dt>
          <dd className={styles.itemContent}>{time2String(task.lastcrawltime)} ({ago(task.lastcrawltime)})</dd>
          <dt className={styles.itemTitle}>updatetime</dt>
          <dd className={styles.itemContent}>{time2String(task.updatetime)} ({ago(task.updatetime)})</dd>

          <dt className={styles.itemTitle}>options</dt>
          <dd className={styles.itemContent}>
            <ReactJson name={false} displayDataTypes={false} src={task.options}/>
          </dd>
          {
            task.track &&
            <Fragment>
              <dt className={styles.itemTitle}>track.request</dt>
              <dd className={styles.itemContent}>
                <ReactJson name={false} displayDataTypes={false} src={task.track.request}/>
              </dd>
              <dt className={styles.itemTitle}>track.fetch</dt>
              <dd className={styles.itemContent}>
                <ReactJson name={false} displayDataTypes={false} src={task.track.fetch}/>
              </dd>
              <dt className={styles.itemTitle}>track.process</dt>
              <dd className={styles.itemContent}>
                <ReactJson name={false} displayDataTypes={false} src={task.track.process}/>
              </dd>

              {
                task.preTask ?
                  <Fragment>
                    <dt className={styles.itemTitle}>preTask</dt>
                    <dd className={styles.itemContent}>
                      <Link to={`/task/${spiderName}/${task.preTask.id}`} target="_blank">
                        {task.preTask.id}
                      </Link>
                      <Divider type="vertical"/>
                      <Link to={`${task.preTask.uri}`} target="_blank">
                        {task.preTask.uri}
                      </Link>
                    </dd>
                  </Fragment> : null
              }

              {
                task.follows && task.follows.length > 0 ?
                  <Fragment>
                    <dt className={styles.itemTitle}>follows</dt>
                    <dd className={styles.itemContent}>
                      {
                        task.follows.map((follow, idx) =>
                          <Fragment key={follow.id}>
                            <span style={{ display: 'inline-block', width: 50, textAlign: 'right' }}> {idx + 1}:</span>
                            <Link to={`/task/${spiderName}/${follow.id}`} target="_blank">
                              {follow.id}
                            </Link>
                            <Divider type="vertical"/>
                            <Link to={`${follow.uri}`} target="_blank">
                              {follow.uri}
                            </Link>
                            <br/>
                          </Fragment>
                        )
                      }
                    </dd>
                  </Fragment> : null
              }


            </Fragment>
          }


          {
            task.body &&
            <Fragment>
              <dt className={styles.itemTitle}>fetch body</dt>
              <dd className={styles.itemContent}>
                <Button onClick={this.showFetchBodyModal.bind(this)}>show fetch body</Button>
              </dd>
            </Fragment>
          }


          {/*<hr/>*/}
          {/*<dt className={styles.itemTitle}>TASK</dt>*/}
          {/*<dd className={styles.itemContent}>*/}
          {/*<ReactJson name={false} displayDataTypes={false} src={task}/>*/}
          {/*</dd>*/}
        </dl>
      </div>
    );
  }

  render() {
    const { tasks: { task }, loading } = this.props;
    return (
      <Spin spinning={loading} size="large" wrapperClassName="spin-full">
        {this.renderTask(task)}
      </Spin>
    );
  }
}
