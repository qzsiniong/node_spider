import {
  spidersInfo,
} from '../services/api';

export default {
  namespace: 'spiderInfos',

  state: {
    info: {},
  },

  effects: {
    * info(_, { call, put }) {
      const response = yield call(spidersInfo);
      yield put({
        type: 'saveInfo',
        payload: response,
      });
    },
  },

  reducers: {
    saveInfo(state, action) {
      return {
        ...state,
        info: action.payload,
      };
    },
  },
};
