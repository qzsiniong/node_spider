import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Button } from 'antd';
import timeLen from 'time-len';

import NumericInput from 'components/NumericInput';


@connect(({ spiders, loading }) => ({
  spiders,
  loading: loading.models.spiders,
}))
@Form.create()
export default class RatePopover extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    };
  }

  handleSubmit = (e) => {
    const { onClose, spiderName } = this.props;
    e.preventDefault();
    this.props.form.validateFields(async (err, { value }) => {
      if (!err) {
        const { success } = await this.props.dispatch({
          type: 'spiders/update',
          payload: {
            spiderName,
            name: 'rate',
            value,
          },
        });
        if (success) {
          onClose();
        }
      }
    });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const { value } = this.props;
    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        {getFieldDecorator('value', {
          initialValue: value
        })(
          <NumericInput
            style={{ width: 120 }}
            addonAfter="ms"
            min={1}
            max={1000 * 60 * 60}
            precision={0}
            tipformat={(v) => timeLen(v, timeLen.unit.zh)}
          />
        )}

        <Button
          type="primary"
          htmlType="submit"
        >
          确定
        </Button>
      </Form>
    );
  }
}
