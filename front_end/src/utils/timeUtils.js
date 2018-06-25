import yieldsAgo from 'yields-ago';
import moment from 'moment';

export function time2Date(time) {
  return new Date(time * 1000);
}

export function ago(time) {
  if (!time){
    return '-';
  }
  return yieldsAgo(time2Date(time));
}

export function time2String(time, format='YYYY-MM-DD HH:mm:ss') {
  if (!time) {
    return 'None';
  }
  return moment.unix(time).format(format);
}
