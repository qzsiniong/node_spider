import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Button, Input } from 'antd';

@connect(({ spiders, loading }) => ({
  spiders,
  loading: loading.models.monitor,
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
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
            name: 'crontime',
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
          <Input style={{ width: 180, marginRight: 10 }}/>
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
