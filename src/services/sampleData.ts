import { format, subDays, addDays, startOfDay } from 'date-fns';
import { AQIMeasurement, WeatherData, FireHotspot, CITIES } from '../types';

export function generateSyntheticAQI(days: number = 30): AQIMeasurement[] {
  const data: AQIMeasurement[] = [];
  const now = new Date();

  const parameters = ['aqi', 'pm25', 'pm10', 'no2', 'o3', 'co', 'so2'];
  
  CITIES.forEach(city => {
    let baseAQI = city.name === 'Delhi' ? 250 : city.name === 'Bangalore' ? 60 : 120;
    
    for (let i = 0; i < days * 24; i++) {
      const date = subDays(now, i / 24);
      const hour = date.getHours();
      const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
      
      parameters.forEach(param => {
        let paramBase = baseAQI;
        if (param === 'co') paramBase = baseAQI / 100;
        if (param === 'so2') paramBase = baseAQI / 5;
        
        let value = paramBase + Math.sin((hour - 6) * Math.PI / 12) * (paramBase * 0.2);
        if (isWeekday) value += (paramBase * 0.1);
        value += (Math.random() - 0.5) * (paramBase * 0.1);
        
        data.push({
          city: city.name,
          parameter: param,
          value: Math.max(1, value),
          unit: param === 'co' ? 'mg/m³' : 'µg/m³',
          date: date.toISOString()
        });
      });
    }
  });

  return data;
}

export function generateSyntheticWeather(days: number = 30): WeatherData[] {
  const data: WeatherData[] = [];
  const now = new Date();

  CITIES.forEach(city => {
    for (let i = 0; i < days * 24; i++) {
      const date = subDays(now, i / 24);
      data.push({
        city: city.name,
        temperature: 25 + (Math.random() - 0.5) * 10,
        windSpeed: 5 + Math.random() * 15,
        windDirection: Math.random() * 360,
        humidity: 40 + Math.random() * 40,
        precipitation: Math.random() > 0.8 ? Math.random() * 10 : 0,
        timestamp: date.toISOString()
      });
    }
  });

  return data;
}

export function generateSyntheticFires(): FireHotspot[] {
  const hotspots: FireHotspot[] = [];
  const regions = [
    { name: 'Punjab', latRange: [30.9, 31.5], lonRange: [74.8, 76.5] },
    { name: 'Haryana', latRange: [29.0, 30.5], lonRange: [75.5, 77.5] },
    { name: 'Uttar Pradesh', latRange: [26.0, 28.5], lonRange: [80.0, 83.0] },
    { name: 'Odisha', latRange: [20.0, 22.0], lonRange: [83.0, 86.5] },
  ];

  for (let i = 0; i < 65; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    hotspots.push({
      latitude: region.latRange[0] + Math.random() * (region.latRange[1] - region.latRange[0]),
      longitude: region.lonRange[0] + Math.random() * (region.lonRange[1] - region.lonRange[0]),
      brightness: 300 + Math.random() * 150,
      confidence: 60 + Math.random() * 40,
      acq_date: format(subDays(new Date(), Math.random() * 7), 'yyyy-MM-dd'),
      state: region.name
    });
  }

  return hotspots;
}
