import * as moment from 'moment';

export function convertISOStringToSQLDate(isoDateString: string): string {
  return moment(isoDateString).format('YYYY-MM-DD');
}
