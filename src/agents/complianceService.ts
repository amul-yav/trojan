import { PollutantViolation, ComplianceReport, CITIES } from '../types';

export class ComplianceService {
  static check(city: string, data: any[]): ComplianceReport {
    const cityData = data.filter(d => d.city === city);
    const violations: PollutantViolation[] = [];

    const standards = {
      pm25: { who: 15, naaqs: 35 },
      pm10: { who: 45, naaqs: 150 },
      no2: { who: 25, naaqs: 100 }
    };

    Object.entries(standards).forEach(([pollutant, limits]) => {
      const measurements = cityData.filter(d => d.parameter === pollutant);
      if (measurements.length > 0) {
        const latest = measurements[measurements.length - 1].value;
        if (latest > limits.who || latest > limits.naaqs) {
          violations.push({
            pollutant,
            value: latest,
            whoThreshold: limits.who,
            naaqsThreshold: limits.naaqs,
            exceedancePercent: ((latest - limits.who) / limits.who) * 100
          });
        }
      }
    });

    const status = violations.length > 2 ? 'violation' : violations.length > 0 ? 'caution' : 'safe';
    
    return {
      city,
      status,
      violations,
      alertUrgencyScore: Math.min(100, violations.reduce((sum, v) => sum + Math.min(100, v.exceedancePercent), 0) / Math.max(violations.length, 1)),
      populationAtRisk: CITIES.find(c => c.name === city)?.population || 500,
      persistenceScore: 50, // Placeholder
      recoveryTimeHours: violations.length * 12
    };
  }
}
