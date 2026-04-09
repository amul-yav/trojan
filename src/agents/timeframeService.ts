import _ from 'lodash';

export interface TimeframeAnalysis {
  avgAQI: number;
  maxAQI: number;
  minAQI: number;
  trend: number; // linear regression slope
}

export class TimeframeService {
  static analyze(data: any[], days: number): TimeframeAnalysis | null {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const filtered = data.filter(d => new Date(d.date || d.timestamp) >= cutoff && d.parameter === 'aqi');
    
    if (filtered.length < 2) return null;

    const values = filtered.map(d => d.value);
    const avgAQI = _.mean(values);
    const maxAQI = _.max(values) || 0;
    const minAQI = _.min(values) || 0;
    
    // Linear regression for trend
    const trend = this.calculateSlope(filtered.map((d, i) => ({ x: i, y: d.value })));

    return { avgAQI, maxAQI, minAQI, trend };
  }

  private static calculateSlope(points: { x: number, y: number }[]): number {
    const n = points.length;
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
}
