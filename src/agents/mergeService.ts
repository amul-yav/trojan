import _ from 'lodash';
import { AQIMeasurement, WeatherData } from '../types';

export class MergeService {
  static merge(aqiData: AQIMeasurement[], weatherData: WeatherData[]): any[] {
    const weatherByCity = new Map<string, WeatherData[]>();
    weatherData.forEach(w => {
      if (!weatherByCity.has(w.city)) weatherByCity.set(w.city, []);
      weatherByCity.get(w.city)!.push(w);
    });
    
    return aqiData.map(aqi => {
      const aqiTime = new Date(aqi.date).getTime();
      const cityWeather = weatherByCity.get(aqi.city) || [];
      
      let closestWeather = null;
      let minDiff = Infinity;
      
      cityWeather.forEach(w => {
        const wTime = new Date(w.timestamp).getTime();
        const diff = Math.abs(aqiTime - wTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestWeather = w;
        }
      });

      // Only merge if within 3 hours
      const isClose = minDiff < 3 * 60 * 60 * 1000;

      return {
        ...aqi,
        temperature: isClose ? closestWeather?.temperature : undefined,
        humidity: isClose ? closestWeather?.humidity : undefined,
        windSpeed: isClose ? closestWeather?.windSpeed : undefined,
        windDirection: isClose ? closestWeather?.windDirection : undefined,
        precipitation: isClose ? closestWeather?.precipitation : undefined
      };
    });
  }

  static resampleToDaily(data: any[]): any[] {
    const grouped = _.groupBy(data, d => {
      const date = new Date(d.date || d.timestamp);
      return `${d.city}-${d.parameter}-${date.toISOString().split('T')[0]}`;
    });

    return Object.values(grouped).map(group => {
      const first = group[0];
      const avgValue = _.meanBy(group, 'value');
      const avgTemp = _.meanBy(group, d => d.temperature ?? null);
      const avgHumidity = _.meanBy(group, d => d.humidity ?? null);

      return {
        ...first,
        value: avgValue,
        temperature: isNaN(avgTemp) ? undefined : avgTemp,
        humidity: isNaN(avgHumidity) ? undefined : avgHumidity,
        date: new Date(first.date || first.timestamp).toISOString().split('T')[0]
      };
    });
  }
}
