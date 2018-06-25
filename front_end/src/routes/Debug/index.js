import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Tabs, Icon, Spin, Button, Badge, message, notification, Timeline, Tag } from 'antd';
import SplitterLayout from 'react-splitter-layout';
import ReactJson from 'react-json-view';


import MonacoEditor from 'react-monaco-editor';
import $ from 'jquery';
import styles from './index.less';
import { time2String } from "utils/timeUtils";

// const path = window.location.href.substring(0,  window.location.href.lastIndexOf('/') + 1);
const requireConfig = {
  url: '/vs/loader.js',
  paths: {
    vs: '/vs',
    md5: `fdfd`,
  }
};

const monacoEditorTheme = "vs-dark";//vs vs-dark  hc-black
const editorCommonOptions = {
  wordWrap: 'on',
  overviewRulerLanes: 0,
  glyphMargin: false,
  lineNumbers: 'on',
  folding: false,
  selectOnLineNumbers: false,
  selectionHighlight: false,
  cursorStyle: 'line-thin',
  scrollbar: {
    useShadows: false,
    horizontal: 'hidden',
    verticalScrollbarSize: 9,
  },
  lineDecorationsWidth: 0,
  scrollBeyondLastLine: false,
  renderLineHighlight: 'none',
  minimap: {
    enabled: false,
  },
  contextmenu: false,
  ariaLabel: 'ConsoleInput',
  fontFamily: 'Menlo, monospace',
  fontSize: 13,
};


@connect(({ spiders, loading }) => ({
  spiders,
  loading: loading.models.spiders,
}))
export default class Index extends PureComponent {

  constructor(props) {
    super(props);
    const { spiders } = props;
    this.state = {
      disableRunBtn: true,
      code: spiders.spiderCode,
      version: spiders.spiderVersion,
      task: JSON.stringify(spiders.task, null, 2),
      follows: [],
      content: null,
      data: [],
      debugInfo: [],
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.spiders.spiderCode !== this.props.spiders.spiderCode) {
      this.setState({ code: nextProps.spiders.spiderCode });
    }
    if (nextProps.spiders.spiderVersion !== this.props.spiders.spiderVersion) {
      this.setState({ version: nextProps.spiders.spiderVersion });
    }
    if (nextProps.spiders.task !== this.props.spiders.task) {
      this.setState({ task: JSON.stringify(nextProps.spiders.task, null, 2), disableRunBtn: false });
    }
  }

  componentDidMount() {
    const { dispatch, match: { params: { spiderName, taskId } } } = this.props;
    dispatch({
      type: 'spiders/fetchSpiderCode',
      payload: {
        spiderName,
        taskId,
      },
    });
    window.addEventListener('resize',()=>this.editorLayout());
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

  onChange(code) {
    this.setState({ code });
  }

  onTaskChange(task) {
    try {
      this.setState({ task, disableRunBtn: false });
    } catch (e) {
      this.setState({ disableRunBtn: true });
    }
  }

  async onRun() {
    const { dispatch, match: { params: { spiderName } } } = this.props;

    const { task } = this.state;
    const { success, data: { follows, content, data, debugInfo } } = await dispatch({
      type: 'spiders/runSpiderDebug',
      payload: {
        spiderName,
        options: task,
      },
    });


    success && this.setState({ follows, content, data, debugInfo });
  }

  async onSave() {
    const { dispatch, match: { params: { spiderName } } } = this.props;

    // const { code } = this.state;
    const code = this.codeEditor.getModel().getValue()
    if (code === null) {
      alert('没有修改');
    } else {
      const { success, data: { version, errMsg: codeErrMsg } } = await dispatch({
        type: 'spiders/updateSpiderCode',
        payload: {
          spiderName,
          code,
        },
      });
      if (success === true) {
        this.setState({ version });
        message.success('保存代码成功');
      } else if (codeErrMsg) {
        notification.error({
          key: 'codeErr',
          message: '错误',
          description: <pre>{codeErrMsg}</pre>,
          // icon: <Icon type="frown" style={{ color: '#ff0000' }} />,
          duration: null,
          style: {
            width: 850,
            marginLeft: 335 - 850,
          },
        });
      }
    }
  }

  async onRunNewTask(task) {
    try {
      this.setState({ task, disableRunBtn: false }, async () => {
        await this.onRun();
      });
    } catch (e) {
      this.setState({ disableRunBtn: true });
    }
  }

  renderHeader() {
    const { match: { params: { spiderName } } } = this.props;
    const { version } = this.state;
    return (
      <div className={styles.taskBaseInfo}>
        <Link to={'/'} style={{ color: '#f0ad4e', paddingRight: 5 }}>node_spider</Link>
        &gt;
        <span>{spiderName}</span> <span>Version:{version}</span>
      </div>
    );
  }

  renderDebugResult() {
    const { follows, data, content, debugInfo } = this.state;
    return (
      <div style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }}>
        <Tabs defaultActiveKey="1" tabPosition="bottom" style={{ width: '100%', height: '100%' }}
              className={styles.tabs}>
          <Tabs.TabPane tab={<span><Icon type="bars"/>follows<Badge count={follows.length} style={{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset' }}/></span>} key="1">
            {this.renderDebugFollows()}
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><Icon type="desktop"/>html</span>} key="2">
            {this.renderDebugHtml()}
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><Icon type="desktop"/>data<Badge count={data.length} style={{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset' }}/></span>} key="3">
            {this.renderDebugData()}
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><Icon type="desktop"/>debugInfo<Badge count={debugInfo.length} style={{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset' }}/></span>} key="4">
            {this.renderDebugInfo()}
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }

  renderDebugFollows() {
    const { follows } = this.state;
    if (!follows || follows.length === 0) {
      return null;
    }
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        {
          follows.map((follow, idx) => {
            const taskShow = this.state[`task-show-${idx}`];
            return (
              <Fragment key={follow.uri}>
                <div className={styles.newtask} data-task="0">
                  <span className={styles["task-callback"]}>{follow.callback}</span> &gt; <span
                  className={styles["task-url"]}>{follow.uri}</span>
                  <div className={styles["task-run"]}
                       onClick={this.onRunNewTask.bind(this, JSON.stringify(follow, null, 2))}><Icon
                    type="caret-right"/></div>
                  <div className={styles["task-more"]}
                       onClick={() => this.setState({ [`task-show-${idx}`]: !taskShow })}><Icon type="info-circle"/>
                  </div>
                </div>
                {
                  taskShow ?
                    <div className="task-show">
                      <ReactJson name={false} enableClipboard={false} displayDataTypes={false} src={follow}/>
                    </div> : null
                }
              </Fragment>
            );
          })
        }
      </div>
    );
  }

  renderDebugHtml() {
    const { content, task } = this.state;
    if (!content) {
      return null;
    }
    const bodyHtml = this.render_html(content, task.uri);
    const ifr = encodeURI(`data:text/html;,${bodyHtml}`);
    return <iframe src={ifr} width="100%" height="100%" title="fetch_body_iframe"/>;
  }

  renderDebugInfo() {
    const { debugInfo } = this.state;
    if (!debugInfo || debugInfo.length === 0) {
      return null;
    }
    return <Timeline style={{height: '100%', overflow: 'auto', padding: '5px'}}>
      {debugInfo.map(({time,info})=>(
        <Timeline.Item>
          {
            typeof(info)==='string'?<div>{info}</div>:<ReactJson name={false} enableClipboard={false} displayDataTypes={false} src={info}/>
          }
        </Timeline.Item>
      ))}
    </Timeline>;
  }

  renderDebugData() {
    const { data } = this.state;
    if (!data || data.length === 0) {
      return null;
    }
    return <ReactJson name={false} enableClipboard={false} displayDataTypes={false} src={data} style={{height: '100%', overflow: 'auto'}}/>;
  }

  async taskEditorDidMount(editor, monaco) {
    this.taskEditor = editor;
  }

  codeEditorWillMount(monaco) {
    const { spiders:{dts} } = this.props;

    dts.forEach((dt,idx)=>{
      monaco.languages.typescript.typescriptDefaults.addExtraLib(dt, `${idx}.d.ts`);
    });
  }

  async codeEditorDidMount(editor, monaco) {
    this.codeEditor = window.codeEditor = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, ()=>{
      this.onSave();
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      Object.assign({}, monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
        { experimentalDecorators: true }
      )
    );
  }

  editorLayout() {
    if (this.taskEditor) {
      this.taskEditor.layout();
    }
    if (this.codeEditor) {
      this.codeEditor.layout();
    }
  }

  renderTask() {
    const { task, disableRunBtn } = this.state;
    const editorOptions = Object.assign({}, editorCommonOptions, { lineNumbers: 'on' })
    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Button
          onClick={this.onRun.bind(this)}
          type="primary"
          size="small"
          disabled={disableRunBtn}
          style={{ position: 'absolute', bottom: 0, zIndex: 1 }}
        >
          运行
        </Button>
        <MonacoEditor
          language="json"
          theme={monacoEditorTheme}
          value={task}
          options={editorOptions}
          onChange={::this.onTaskChange}
          editorDidMount={this.taskEditorDidMount.bind(this)}
          requireConfig={requireConfig}
        />
      </div>
    );
  }

  renderCodeEditor() {
    const { code } = this.state;
    const editorOptions = Object.assign({}, editorCommonOptions, {
      contextmenu: true,
      minimap: {
        enabled: true,
      },
    })
    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Button onClick={this.onSave.bind(this)} type="primary" size="small"
                style={{ position: 'absolute', right: 0, zIndex: 1 }}>保存</Button>
        <MonacoEditor
          language="typescript"
          theme={monacoEditorTheme}
          onChange={this.onChange.bind(this)}
          value={code}
          options={editorOptions}
          editorWillMount={this.codeEditorWillMount.bind(this)}
          editorDidMount={this.codeEditorDidMount.bind(this)}
          requireConfig={requireConfig}
        />
      </div>
    );
  }

  render() {
    const { loading } = this.props;
    return (
      <Spin spinning={loading} delay={100} wrapperClassName="spin-full" style={{ width: '100%', height: '100%' }}>
        {this.renderHeader()}
        <div className={styles.content}>
          <SplitterLayout
            percentage={true}
            primaryIndex={1}
            primaryMinSize={20}
            secondaryMinSize={20}
            secondaryInitialSize={35}
            onSecondaryPaneSizeChange={this.editorLayout.bind(this)}
          >
            <SplitterLayout
              percentage={true}
              vertical={true}
              primaryIndex={1}
              primaryMinSize={20}
              secondaryMinSize={20}
              secondaryInitialSize={30}
              onSecondaryPaneSizeChange={this.editorLayout.bind(this)}
            >
              <Fragment>
                {this.renderTask()}
              </Fragment>
              <Fragment>
                {this.renderDebugResult()}
              </Fragment>
            </SplitterLayout>
            <Fragment>
              {this.renderCodeEditor()}
            </Fragment>
          </SplitterLayout>
        </div>
      </Spin>
    );
  }
}
