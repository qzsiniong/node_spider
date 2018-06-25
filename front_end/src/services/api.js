import { stringify } from 'qs';
import request from '../utils/request';

export async function querySpiders() {
  return request('/api/spiders');
}

export async function updateSpiders({ spiderName, name, value }) {
  return request(`/api/spiders/${spiderName}`, {
    method: 'POST',
    body: { name, value },
  });
}

export async function updateSpiderCode({ spiderName, code }) {
  return request(`/api/spiders/${spiderName}/code`, {
    method: 'POST',
    body: { code },
  });
}

export async function spidersInfo() {
  return request('/api/spiderInfos');
}

export async function querySpiderCode({ spiderName, taskId }) {
  return request(`/api/spiders/${spiderName}?taskId=${taskId || ''}`);
}

export async function runSpiderDebug({ spiderName, options }) {
  return request(`/api/spiders/${spiderName}/debug`, {
    method: 'POST',
    body: {
      options
    },
  });
}

export async function startSpider({ spiderName }) {
  return request(`/api/spiders/${spiderName}/start`, {
    method: 'POST'
  });
}

export async function queryTasks(params) {
  return request(`/api/tasks?${stringify(params)}`);
}


export async function queryTask({ spiderName, taskId }) {
  return request(`/api/tasks/${spiderName}:${taskId}`);
}

export async function recrawlTask({ spiderName, taskId }) {
  return request(`/api/tasks/${spiderName}:${taskId}/recrawl`, {
    method: 'PUT',
    body: { spiderName, taskId },
  });
}

export async function deleteTask({ spiderName, taskId }) {
  return request(`/api/tasks/${spiderName}:${taskId}`, {
    method: 'DELETE',
  });
}
