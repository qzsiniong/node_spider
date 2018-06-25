import React, { PureComponent } from 'react';
import { Tooltip } from 'antd';

import classNames from 'classnames';

import styles from './ProcessBar.less';

export default class ProcessBar extends PureComponent {
  render() {
    const { label } = this.props;
    const data = this.props.data || { newly: 0, success: 0, failed: 0, retry: 0 };
    const { newly, success, failed, retry } = data;
    const sum = newly + success + failed + retry;
    const [
      newlyPercent,
      successPercent,
      retryPercent,
      failedPercent,
    ] = [
      sum === 0 ? 0 : (newly / sum * 100).toFixed(2),
      sum === 0 ? 0 : (success / sum * 100).toFixed(2),
      sum === 0 ? 0 : (retry / sum * 100).toFixed(2),
      sum === 0 ? 0 : (failed / sum * 100).toFixed(2),
    ];

    const tooltip = (
      <div>
        <p>{label} of {sum} tasks</p>
        <p>new({newlyPercent}%){newly}</p>
        <p>success({successPercent}%){success}</p>
        <p>retry({retryPercent}%){retry}</p>
        <p>failed({failedPercent}%){failed}</p>
      </div>
    );

    return (
      <Tooltip title={tooltip}>
        <div className={styles.progress}>
          <div className={styles['progress-text']}>{label}<span>: {sum}</span></div>
          <div
            className={classNames(styles['progress-bar'], styles['progress-pending'])}
            style={{ width: `${newlyPercent}%` }}
          />
          <div
            className={classNames(styles['progress-bar'], styles['progress-bar-success'], styles['progress-success'])}
            style={{ width: `${successPercent}%` }}
          />
          <div
            className={classNames(styles['progress-bar'], styles['progress-bar-warning'], styles['progress-retry'])}
            style={{ width: `${retryPercent}%` }}
          />
          <div
            className={classNames(styles['progress-bar'], styles['progress-bar-danger'], styles['progress-failed'])}
            style={{ width: `${failedPercent}%` }}
          />
        </div>
        <span />
      </Tooltip>

    );
  }
}
