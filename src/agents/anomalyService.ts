import _ from 'lodash';
import { Anomaly } from '../types';

export class AnomalyService {
  static detect(data: any[], threshold: number = 10): Anomaly[] {
    if (data.length < threshold) return [];

    const anomalies: Anomaly[] = [];
    const grouped = _.groupBy(data, d => `${d.city}-${d.parameter}`);

    Object.values(grouped).forEach(group => {
      const values = group.map(d => d.value);
      const mean = _.mean(values);
      const std = Math.sqrt(_.mean(values.map(v => Math.pow(v - mean, 2))));

      group.forEach((d, i) => {
        // 1. Z-score (>2.5)
        const zScore = std > 0 ? Math.abs(d.value - mean) / std : 0;
        
        // 2. Rate-of-change detection
        let roc = 0;
        if (i > 0) {
          roc = Math.abs(d.value - group[i-1].value);
        }

        // 3. Flatline detection (check last 5 values)
        let isFlatline = false;
        if (i >= 4) {
          const last5 = group.slice(i-4, i+1).map(v => v.value);
          isFlatline = _.uniq(last5).length === 1;
        }

        if (zScore > 2.5 || roc > mean * 0.5 || isFlatline) {
          anomalies.push({
            timestamp: d.date || d.timestamp,
            city: d.city,
            pollutant: d.parameter,
            value: d.value,
            severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
            possibleCause: isFlatline ? 'Possible Sensor Issue' : 'Likely Environmental Event',
            anomalyType: isFlatline ? 'sensor_fault' : 'real_event',
            rateOfChange: roc
          });
        }
      });
    });

    return anomalies;
  }
}
