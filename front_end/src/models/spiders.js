import {
  querySpiders,
  updateSpiders,
  querySpiderCode,
  updateSpiderCode,
  runSpiderDebug,
  startSpider,
} from '../services/api';

export default {
  namespace: 'spiders',

  state: {
    list: [],
    spiderCode: '',
    dts: [],
    spiderVersion: null,
    task: null,
  },

  effects: {
    * fetchSpiders(_, { call, put }) {
      const response = yield call(querySpiders);
      yield put({
        type: 'saveSpiders',
        payload: response.list,
      });
    },
    * fetchSpiderCode({ payload: { spiderName, taskId } }, { call, put }) {
      const response = yield call(querySpiderCode, { spiderName, taskId });
      yield put({
        type: 'saveSpiderCode',
        payload: response.data,
      });
    },
    * update({ payload: { spiderName, name, value } }, { call, put }) {
      const ret = yield call(updateSpiders, { spiderName, name, value });
      if (ret.success) {
        yield put({
          type: 'updSpider',
          payload: {
            spiderName, name, value: ret.data
          },
        });
      }
      return ret;
    },
    * updateSpiderCode({ payload }, { call, put }) {
      return yield call(updateSpiderCode, payload);
    },
    * runSpiderDebug({ payload: { spiderName, options } }, { call, put }) {
      return yield call(runSpiderDebug, { spiderName, options });
    },
    * startSpider({ payload: { spiderName } }, { call, put }) {
      return yield call(startSpider, { spiderName });
    },
  },

  reducers: {
    saveSpiders(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
    saveSpiderCode(state, { payload }) {
      return {
        ...state,
        spiderCode: payload.code,
        spiderVersion: payload.version,
        dts: payload.dts,
        task: payload.task,
      };
    },
    updSpider(state, action) {
      const { spiderName, name, value } = action.payload;
      const { list } = state;
      const spider = list.find((spider) => spider.name === spiderName);
      if (spider) {
        spider[name] = value;
      }
      return {
        ...state,
        list,
      };
    }
  },
};
