import { CorrelationData } from '../types';

export class InsightService {
  static generate(city: string, results: any): string[] {
    const insights: string[] = [];
    const { timeframe, compliance, anomalies, weatherCorr } = results;

    if (timeframe && timeframe.trend > 0) {
      insights.push(`Air quality in ${city} may be worsening based on the 30-day trend.`);
    } else if (timeframe && timeframe.trend < 0) {
      insights.push(`Air quality in ${city} is likely improving.`);
    }

    if (compliance.status === 'violation') {
      insights.push(`Critical: ${city} is currently in violation of health standards.`);
    }

    if (weatherCorr && Math.abs(weatherCorr.coefficient) > 0.5) {
      insights.push(`A possible correlation exists between ${weatherCorr.factorA} and ${weatherCorr.factorB}.`);
    }

    if (anomalies.length > 0) {
      insights.push(`Recent anomalies detected; these may indicate localized environmental events.`);
    }

    return insights;
  }

  static calculateWeatherCorrelation(data: any[]): CorrelationData[] {
    const correlations: CorrelationData[] = [];
    const cityData = data.filter(d => d.parameter === 'pm25');
    
    if (cityData.length < 10) return [];

    // 1. Temperature vs PM2.5
    const tempX = cityData.filter(d => d.temperature !== undefined).map(d => d.temperature);
    const tempY = cityData.filter(d => d.temperature !== undefined).map(d => d.value);
    if (tempX.length >= 10) {
      const r = this.pearsonCorrelation(tempX, tempY);
      correlations.push({
        factorA: 'Temperature',
        factorB: 'PM2.5',
        coefficient: parseFloat(r.toFixed(2)),
        significance: Math.abs(r) > 0.7 ? 'High' : Math.abs(r) > 0.4 ? 'Medium' : 'Low',
        insight: r > 0 
          ? "Higher temperatures may be associated with increased PM2.5 levels."
          : "Lower temperatures may be associated with increased PM2.5 levels."
      });
    }

    // 2. Humidity vs PM2.5
    const humX = cityData.filter(d => d.humidity !== undefined).map(d => d.humidity);
    const humY = cityData.filter(d => d.humidity !== undefined).map(d => d.value);
    if (humX.length >= 10) {
      const r = this.pearsonCorrelation(humX, humY);
      correlations.push({
        factorA: 'Humidity',
        factorB: 'PM2.5',
        coefficient: parseFloat(r.toFixed(2)),
        significance: Math.abs(r) > 0.7 ? 'High' : Math.abs(r) > 0.4 ? 'Medium' : 'Low',
        insight: r > 0 
          ? "High humidity likely trapping particulates near the ground."
          : "Lower humidity levels associated with particulate dispersion."
      });
    }

    return correlations;
  }

  private static pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    if (den === 0) return 0;
    return num / den;
  }
}
