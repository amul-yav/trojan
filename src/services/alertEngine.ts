import { PipelineResults, AlertThresholds, AlertRule, AlertRecord, AlertTriggerType } from '../types';

export class AlertEngine {
  static evaluate(
    results: PipelineResults,
    thresholds: AlertThresholds,
    rules: AlertRule[],
    sentAlertIds: Set<string>
  ): AlertRecord[] {
    const newAlerts: AlertRecord[] = [];
    const now = Date.now();
    const timeWindow = Math.floor(now / 300000); // 5-minute window

    const createAlert = (
      triggerType: AlertTriggerType,
      city: string,
      message: string,
      pollutant?: string,
      value?: number
    ): AlertRecord | null => {
      const id = `${triggerType}-${city}-${timeWindow}`;
      if (sentAlertIds.has(id)) return null;

      return {
        id,
        triggeredAt: new Date().toISOString(),
        triggerType,
        city,
        message,
        pollutant,
        value,
        emailSent: false
      };
    };

    rules.forEach(rule => {
      if (!rule.enabled) return;

      switch (rule.triggerType) {
        case 'aqi_spike':
          results.risks.forEach(risk => {
            if (risk.currentAQI >= thresholds.aqiSpike) {
              const alert = createAlert(
                'aqi_spike',
                risk.city,
                `AQI spike detected in ${risk.city}: ${risk.currentAQI} (threshold: ${thresholds.aqiSpike})`,
                'AQI',
                risk.currentAQI
              );
              if (alert) newAlerts.push(alert);
            }
          });
          break;

        case 'compliance_violation':
          results.complianceReports.forEach(report => {
            if (report.status === 'violation' && report.alertUrgencyScore >= thresholds.urgencyScoreMin) {
              const pollutants = report.violations.map(v => v.pollutant).join(', ');
              const alert = createAlert(
                'compliance_violation',
                report.city,
                `Compliance violation in ${report.city}: ${pollutants} exceed WHO/EPA standards`,
                pollutants,
                report.alertUrgencyScore
              );
              if (alert) newAlerts.push(alert);
            }
          });
          break;

        case 'ozone_breach':
          results.risks.forEach(risk => {
            if (risk.pollutants.o3 >= thresholds.ozone) {
              const alert = createAlert(
                'ozone_breach',
                risk.city,
                `Ozone (O₃) breach in ${risk.city}: ${risk.pollutants.o3.toFixed(1)} µg/m³ exceeds WHO limit of ${thresholds.ozone}`,
                'O3',
                risk.pollutants.o3
              );
              if (alert) newAlerts.push(alert);
            }
          });
          break;

        case 'no2_breach':
          results.risks.forEach(risk => {
            if (risk.pollutants.no2 >= thresholds.no2) {
              const alert = createAlert(
                'no2_breach',
                risk.city,
                `NO₂ breach in ${risk.city}: ${risk.pollutants.no2.toFixed(1)} µg/m³ — likely vehicular/industrial source`,
                'NO2',
                risk.pollutants.no2
              );
              if (alert) newAlerts.push(alert);
            }
          });
          break;

        case 'so2_breach':
          results.risks.forEach(risk => {
            if (risk.pollutants.so2 >= thresholds.so2) {
              const alert = createAlert(
                'so2_breach',
                risk.city,
                `SO₂ breach in ${risk.city}: ${risk.pollutants.so2.toFixed(1)} µg/m³ — possible industrial emission event`,
                'SO2',
                risk.pollutants.so2
              );
              if (alert) newAlerts.push(alert);
            }
          });
          break;

        case 'pm25_breach':
          results.risks.forEach(risk => {
            if (risk.pollutants.pm25 >= thresholds.pm25) {
              const alert = createAlert(
                'pm25_breach',
                risk.city,
                `PM2.5 breach in ${risk.city}: ${risk.pollutants.pm25.toFixed(1)} µg/m³ exceeds WHO annual guideline`,
                'PM2.5',
                risk.pollutants.pm25
              );
              if (alert) newAlerts.push(alert);
            }
          });
          break;

        case 'sensor_fault_cluster':
          const cityFaults: Record<string, number> = {};
          results.findings.anomalies.forEach(anomaly => {
            if (anomaly.anomalyType === 'sensor_fault') {
              cityFaults[anomaly.city] = (cityFaults[anomaly.city] || 0) + 1;
            }
          });

          Object.entries(cityFaults).forEach(([city, count]) => {
            if (count >= 3) {
              const alert = createAlert(
                'sensor_fault_cluster',
                city,
                `Sensor fault cluster in ${city}: ${count} sensors reporting anomalous readings — data may be unreliable`,
                'Multiple Sensors',
                count
              );
              if (alert) newAlerts.push(alert);
            }
          });
          break;

        case 'forecast_crisis':
          const cityForecasts: Record<string, any> = {};
          results.forecasts.forEach(forecast => {
            if (forecast.crisis_predicted && forecast.forecast_aqi >= thresholds.forecastCrisisAQI) {
              if (!cityForecasts[forecast.city] || new Date(forecast.date) < new Date(cityForecasts[forecast.city].date)) {
                cityForecasts[forecast.city] = forecast;
              }
            }
          });

          Object.values(cityForecasts).forEach(forecast => {
            const alert = createAlert(
              'forecast_crisis',
              forecast.city,
              `Crisis forecasted for ${forecast.city}: AQI projected at ${forecast.forecast_aqi} on ${new Date(forecast.date).toLocaleDateString()}`,
              'AQI Forecast',
              forecast.forecast_aqi
            );
            if (alert) newAlerts.push(alert);
          });
          break;
      }
    });

    return newAlerts;
  }
}
