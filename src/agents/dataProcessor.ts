import _ from 'lodash';
import { AQIMeasurement } from '../types';

export class DataProcessor {
  static processAQI(data: AQIMeasurement[]): AQIMeasurement[] {
    if (!data || data.length === 0) return [];

    // 1. Parse timestamps and sort chronologically
    let processed = _.sortBy(data, 'date');

    // 2. Remove duplicates (city + parameter + timestamp)
    processed = _.uniqBy(processed, d => `${d.city}-${d.parameter}-${d.date}`);

    // 3. Interpolate numeric gaps (simple forward fill)
    const grouped = _.groupBy(processed, d => `${d.city}-${d.parameter}`);
    const filled: AQIMeasurement[] = [];

    Object.values(grouped).forEach(group => {
      const sorted = _.sortBy(group, 'date');
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].value === null || sorted[i].value === undefined) {
          sorted[i].value = sorted[i - 1].value;
        }
      }
      filled.push(...sorted);
    });

    return _.sortBy(filled, 'date');
  }

  static interpolateGaps(values: (number | null)[]): number[] {
    const result = [...values];
    for (let i = 0; i < result.length; i++) {
      if (result[i] === null) {
        // Find nearest non-null values
        let prev = null;
        for (let j = i - 1; j >= 0; j--) {
          if (result[j] !== null) {
            prev = result[j];
            break;
          }
        }
        let next = null;
        for (let j = i + 1; j < result.length; j++) {
          if (result[j] !== null) {
            next = result[j];
            break;
          }
        }

        if (prev !== null && next !== null) {
          result[i] = (prev + next) / 2;
        } else if (prev !== null) {
          result[i] = prev;
        } else if (next !== null) {
          result[i] = next;
        } else {
          result[i] = 0; // Fallback
        }
      }
    }
    return result as number[];
  }
}
