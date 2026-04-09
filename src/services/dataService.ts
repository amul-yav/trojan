import { AQIMeasurement, WeatherData, CITIES } from '../types';
import { generateSyntheticAQI, generateSyntheticWeather } from './sampleData';
import _ from 'lodash';

export async function fetchAQIData(): Promise<AQIMeasurement[]> {
  try {
    const chunks = _.chunk(CITIES, 50);
    const allAqi: AQIMeasurement[] = [];

    for (const chunk of chunks) {
      const lats = chunk.map(c => c.lat).join(',');
      const lons = chunk.map(c => c.lon).join(',');
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&past_days=7`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Open-Meteo AQ failed');
      const data = await response.json();

      const results = Array.isArray(data) ? data : [data];

      results.forEach((res: any, idx: number) => {
        const city = chunk[idx].name;
        const hourly = res.hourly;
        
        if (!hourly) return;

        hourly.time.forEach((time: string, tIdx: number) => {
          const params = [
            { p: 'pm25', v: hourly.pm2_5[tIdx], u: 'µg/m³' },
            { p: 'pm10', v: hourly.pm10[tIdx], u: 'µg/m³' },
            { p: 'no2', v: hourly.nitrogen_dioxide[tIdx], u: 'µg/m³' },
            { p: 'o3', v: hourly.ozone[tIdx], u: 'µg/m³' },
            { p: 'co', v: hourly.carbon_monoxide[tIdx] / 1000, u: 'mg/m³' },
            { p: 'so2', v: hourly.sulphur_dioxide[tIdx], u: 'µg/m³' }
          ];

          params.forEach(param => {
            if (param.v !== null && param.v !== undefined) {
              allAqi.push({
                city,
                parameter: param.p,
                value: param.v,
                unit: param.u,
                date: time
              });
            }
          });
        });
      });
    }
    return allAqi;
  } catch (error) {
    console.warn('Falling back to synthetic AQI data', error);
    return generateSyntheticAQI();
  }
}

export async function fetchWeatherData(): Promise<WeatherData[]> {
  try {
    const chunks = _.chunk(CITIES, 50);
    const allWeather: WeatherData[] = [];

    for (const chunk of chunks) {
      const lats = chunk.map(c => c.lat).join(',');
      const lons = chunk.map(c => c.lon).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&past_days=7`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Open-Meteo Weather failed');
      const data = await response.json();

      const results = Array.isArray(data) ? data : [data];

      results.forEach((res: any, idx: number) => {
        const city = chunk[idx].name;
        const hourly = res.hourly;

        if (!hourly) return;

        hourly.time.forEach((time: string, tIdx: number) => {
          allWeather.push({
            city,
            temperature: hourly.temperature_2m[tIdx],
            windSpeed: hourly.wind_speed_10m[tIdx],
            windDirection: hourly.wind_direction_10m[tIdx],
            humidity: hourly.relative_humidity_2m[tIdx],
            precipitation: hourly.precipitation[tIdx],
            timestamp: time
          });
        });
      });
    }
    return allWeather;
  } catch (error) {
    console.warn('Falling back to synthetic weather data', error);
    return generateSyntheticWeather();
  }
}
