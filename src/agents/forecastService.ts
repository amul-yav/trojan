import { ForecastData } from '../types';
import _ from 'lodash';

export class ForecastService {
  static forecast(data: any[], city: string): ForecastData[] {
    // Try pm25 first, then aqi, then any available parameter for this city
    const pm25Data  = _.sortBy(data.filter(d => d.city === city && d.parameter === 'pm25'), 'date');
    const aqiData   = _.sortBy(data.filter(d => d.city === city && d.parameter === 'aqi'),  'date');
    const anyData   = _.sortBy(data.filter(d => d.city === city), 'date');

    const sourceData = pm25Data.length > 0 ? pm25Data
                     : aqiData.length  > 0 ? aqiData
                     : anyData.length  > 0 ? anyData
                     : [];

    // Use last known value, or safe default if no data at all
    const lastValue = sourceData.length > 0
      ? sourceData[sourceData.length - 1].value
      : 100;

    // Compute a simple trend from available data (slope of last N points)
    const trend = sourceData.length >= 2
      ? (sourceData[sourceData.length - 1].value - sourceData[0].value) / sourceData.length
      : 0;

    // Volatility: std deviation of available values, used for confidence scoring
    const values     = sourceData.map(d => d.value);
    const mean       = values.length > 0 ? _.mean(values) : lastValue;
    const variance   = values.length > 1
      ? _.mean(values.map(v => Math.pow(v - mean, 2)))
      : 0;
    const volatility = Math.sqrt(variance);

    const forecasts: ForecastData[] = [];
    const now = new Date();

    // Generate 3-day (72h) forecast using EWMA projection with trend
    const alpha = 0.3;
    let ewma = lastValue;

    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);

      // EWMA step + gentle trend continuation + small noise
      ewma = alpha * lastValue + (1 - alpha) * ewma;
      const trendContribution = trend * i * 0.5;
      const noise = (Math.random() - 0.5) * Math.max(5, volatility * 0.3);
      const forecast_aqi = Math.max(5, ewma + trendContribution + noise);

      // Confidence drops over time and with higher volatility
      const forecastConfidence = Math.max(
        20,
        Math.min(92, 90 - (i * 8) - (volatility * 0.5))
      );

      // Uncertainty band widens over time
      const bandWidth = 10 + (i * 8) + (volatility * 0.4);

      forecasts.push({
        date:               forecastDate.toISOString(),
        city,
        forecast_aqi:       Math.round(forecast_aqi * 10) / 10,
        lower_bound:        Math.max(0, Math.round((forecast_aqi - bandWidth) * 10) / 10),
        upper_bound:        Math.round((forecast_aqi + bandWidth) * 10) / 10,
        crisis_predicted:   forecast_aqi > 300,
        forecastConfidence: Math.round(forecastConfidence),
      });
    }

    return forecasts;
  }
}
