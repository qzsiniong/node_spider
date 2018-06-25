import React, { PureComponent } from 'react';
import { InputNumber, Tooltip } from 'antd';

function formatNumber(value) {
  value += '';
  const list = value.split('.');
  const prefix = list[0].charAt(0) === '-' ? '-' : '';
  let num = prefix ? list[0].slice(1) : list[0];
  let result = '';
  while (num.length > 3) {
    result = `,${num.slice(-3)}${result}`;
    num = num.slice(0, num.length - 3);
  }
  if (num) {
    result = num + result;
  }
  return `${prefix}${result}${list[1] ? `.${list[1]}` : ''}`;
}

export default class NumericInput extends PureComponent {
  render() {
    const { value, tipformat } = this.props;
    const title = /\d+/.test(String(value)) ? (
      <span className="numeric-input-title">
        {(tipformat || formatNumber)(value)}
      </span>
    ) : '请输入一个数字';
    return (
      <Tooltip
        trigger={['focus']}
        title={title}
        placement="topLeft"
        overlayClassName="numeric-input"
      >
        <InputNumber
          {...this.props}
        />
      </Tooltip>
    );
  }
}
