import React from 'react';
import dynamic from 'dva/dynamic';
import { Router, Route, Switch } from 'dva/router';

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => dynamic({
  app,
  // eslint-disable-next-line no-underscore-dangle
  models: () => models.filter(m => !app._models.some(({ namespace }) => namespace === m)).map(m => import(`./models/${m}.js`)),
  // add routerData prop
  component: () => {
    // const routerData = getRouterData(app);
    return component();
  },
});

function RouterConfig({ history, app }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path="/" exact component={dynamicWrapper(app, ['spiders', 'spiderInfos'], () => import('./routes/Dashboard'))} />
        <Route path="/tasks/:spiderName/:limit?" exact component={dynamicWrapper(app, ['tasks'], () => import('./routes/Tasks'))} />
        <Route path="/task/:spiderName/:taskId" exact component={dynamicWrapper(app, ['tasks'], () => import('./routes/Task'))} />
        <Route path="/debug/:spiderName/:taskId?" exact component={dynamicWrapper(app, ['spiders'], () => import('./routes/Debug'))} />

        <Route component={dynamicWrapper(app, [], () => import('./routes/Exception/404'))} />
      </Switch>
    </Router>
  );
}

export default RouterConfig;
