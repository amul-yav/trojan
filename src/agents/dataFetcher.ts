import { AQIMeasurement, WeatherData, City, CITIES } from '../types';

export class DataFetcher {
  private static OPENAQ_API_KEY = import.meta.env.VITE_OPENAQ_API_KEY;
  private static WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN;

  static async fetchAQI(city: string): Promise<any> {
    try {
      const cityInfo = CITIES.find(c => c.name === city);
      if (!cityInfo) return null;

      // Prefer WAQI if token is available
      if (this.WAQI_TOKEN) {
        const response = await fetch(
          `https://api.waqi.info/feed/geo:${cityInfo.lat};${cityInfo.lon}/?token=${this.WAQI_TOKEN}`
        );
        const json = await response.json();
        if (json.status === 'ok') return json.data;
      }

      // Fallback to OpenAQ if WAQI fails or no token
      const headers: Record<string, string> = {};
      if (this.OPENAQ_API_KEY) {
        headers['X-API-Key'] = this.OPENAQ_API_KEY;
      }

      // Fetch last 48 hours of data to have a trend
      const dateFrom = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `https://api.openaq.org/v2/measurements?coordinates=${cityInfo.lat},${cityInfo.lon}&radius=50000&limit=1000&date_from=${dateFrom}`,
        { headers }
      );
      const json = await response.json();
      return json.results || [];
    } catch (error) {
      console.error(`Error fetching AQI for ${city}:`, error);
      return null;
    }
  }

  static async fetchWeather(lat: number, lon: number): Promise<any> {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation`
      );
      const json = await response.json();
      return json;
    } catch (error) {
      console.error(`Error fetching weather for ${lat}, ${lon}:`, error);
      return null;
    }
  }

  static normalizeAQI(city: string, data: any): AQIMeasurement[] {
    if (!data) return [];
    
    // Handle WAQI format (Object with iaqi)
    if (data.iaqi) {
      const measurements: AQIMeasurement[] = [];
      const timestamp = data.time?.iso || new Date().toISOString();
      
      // Map WAQI parameters to our standard names
      const paramMap: Record<string, string> = {
        pm25: 'pm25',
        pm10: 'pm10',
        no2: 'no2',
        o3: 'o3',
        co: 'co',
        so2: 'so2'
      };

      Object.entries(data.iaqi).forEach(([key, val]: [string, any]) => {
        if (paramMap[key]) {
          measurements.push({
            city,
            parameter: paramMap[key],
            value: val.v,
            unit: key === 'co' ? 'mg/m³' : 'µg/m³',
            date: timestamp
          });
        }
      });

      // Also include the overall AQI as a parameter
      if (data.aqi !== undefined) {
        measurements.push({
          city,
          parameter: 'aqi',
          value: data.aqi,
          unit: 'index',
          date: timestamp
        });
      }

      return measurements;
    }

    // Handle OpenAQ format (Array of measurements)
    if (Array.isArray(data)) {
      return data.map((m: any) => ({
        city,
        parameter: m.parameter,
        value: m.value,
        unit: m.unit,
        date: m.date?.utc || new Date().toISOString()
      }));
    }

    return [];
  }

  static normalizeWeather(city: string, data: any): WeatherData[] {
    if (!data || !data.hourly) return [];

    const weatherData: WeatherData[] = [];
    const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, wind_direction_10m, precipitation } = data.hourly;

    for (let i = 0; i < time.length; i++) {
      weatherData.push({
        city,
        temperature: temperature_2m[i],
        humidity: relative_humidity_2m[i],
        windSpeed: wind_speed_10m[i],
        windDirection: wind_direction_10m[i],
        precipitation: precipitation[i] || 0,
        timestamp: time[i]
      });
    }

    return weatherData;
  }
}
