import { queryTasks, queryTask, recrawlTask, deleteTask } from '../services/api';

export default {
  namespace: 'tasks',

  state: {
    list: [],
    total: 0,
    counterByStatus: {},
    task: null
  },

  effects: {
    * fetchTasks({ payload }, { call, put }) {
      const response = yield call(queryTasks, payload);
      yield put({
        type: 'saveTasks',
        payload: response,
      });
    },
    * fetchTask({ payload: { spiderName, taskId } }, { call, put }) {
      const response = yield call(queryTask, { spiderName, taskId });
      yield put({
        type: 'saveTask',
        payload: response.data,
      });
    },
    * recrawl({ payload: { spiderName, taskId } }, { call, put }) {
      const ret = yield call(recrawlTask, { spiderName, taskId });
      return ret;
    },
    * del({ payload: { spiderName, taskId } }, { call, put }) {
      const ret = yield call(deleteTask, { spiderName, taskId });
      return ret;
    },
  },

  reducers: {
    saveTasks(state, { payload: { list, total, counterByStatus } }) {
      return {
        ...state,
        list,
        total,
        counterByStatus,
      };
    },
    saveTask(state, action) {
      return {
        ...state,
        task: action.payload,
      };
    },
  },
};
