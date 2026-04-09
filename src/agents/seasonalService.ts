import _ from 'lodash';

export class SeasonalService {
  static analyze(data: any[]): any | null {
    if (data.length < 365) return null; // Need at least 1 year of data

    const groupedByMonth = _.groupBy(data, d => {
      const date = new Date(d.date || d.timestamp);
      return date.getMonth(); // 0-11
    });

    const monthlyAvg = Object.entries(groupedByMonth).map(([month, group]) => ({
      month: parseInt(month),
      avgAQI: _.meanBy(group.filter(d => d.parameter === 'aqi'), 'value')
    }));

    return {
      seasonalTrends: _.sortBy(monthlyAvg, 'month')
    };
  }
}
