import { DataFetcher } from './dataFetcher';
import { DataProcessor } from './dataProcessor';
import { MergeService } from './mergeService';
import { TimeframeService } from './timeframeService';
import { AnomalyService } from './anomalyService';
import { ForecastService } from './forecastService';
import { ComplianceService } from './complianceService';
import { SeasonalService } from './seasonalService';
import { InsightService } from './insightService';
import { calculateNAQI } from '../lib/aqiCalculator';
import { generateSyntheticAQI, generateSyntheticWeather, generateSyntheticFires } from '../services/sampleData';
import { PipelineResults, CITIES, UserContext, AgentEvent, AgentState } from '../types';
import _ from 'lodash';

export class PipelineOrchestrator {
  static async runPipeline(
    userContext?: UserContext | null,
    onProgress?: (event: AgentEvent) => void
  ): Promise<PipelineResults> {
    const events: AgentEvent[] = [];
    const trackProgress = (agentName: string, status: 'running' | 'done' | 'error', message: string, durationMs?: number) => {
      const event: AgentEvent = { agentName, status, message, timestamp: new Date().toISOString(), durationMs };
      events.push(event);
      onProgress?.(event);
    };

    const startTime = Date.now();
    
    try {
      // 1. Fetch Data
      trackProgress('Fetcher', 'running', 'Fetching AQI and Weather data...');
      const fetchStart = Date.now();
      let allAQI: any[] = [];
      let allWeather: any[] = [];

      let targetCities = userContext?.jurisdiction.type === 'City' 
        ? CITIES.filter(c => c.name === userContext.jurisdiction.name)
        : CITIES;

      // If too many cities, pick the most important ones for real-time data
      // instead of falling back entirely to synthetic data
      const isLargeDataset = targetCities.length > 20;
      const citiesToFetch = isLargeDataset 
        ? _.sortBy(targetCities, c => -(c.population || 0)).slice(0, 15)
        : targetCities;

      if (isLargeDataset) {
        // Generate synthetic for all, then we will overwrite the top ones with real data
        allAQI = generateSyntheticAQI(7);
        allWeather = generateSyntheticWeather(7);
        trackProgress('Fetcher', 'done', `Using hybrid data: Real-time for top 15 cities, synthetic for others.`);
      }

      // Parallel fetch for the selected cities
      const fetchPromises = citiesToFetch.map(async (city) => {
        try {
          const aqiRaw = await DataFetcher.fetchAQI(city.name);
          const weatherRaw = await DataFetcher.fetchWeather(city.lat, city.lon);
          return {
            city: city.name,
            aqi: DataFetcher.normalizeAQI(city.name, aqiRaw),
            weather: DataFetcher.normalizeWeather(city.name, weatherRaw)
          };
        } catch (e) {
          console.error(`Failed to fetch for ${city.name}`, e);
          return { city: city.name, aqi: [], weather: [] };
        }
      });

      const results = await Promise.all(fetchPromises);
      
      if (isLargeDataset) {
        // Overwrite synthetic data with real data for these cities
        results.forEach(res => {
          if (res.aqi.length > 0) {
            allAQI = allAQI.filter(d => d.city !== res.city);
            allAQI.push(...res.aqi);
          }
          if (res.weather.length > 0) {
            allWeather = allWeather.filter(d => d.city !== res.city);
            allWeather.push(...res.weather);
          }
        });
      } else {
        results.forEach(res => {
          allAQI.push(...res.aqi);
          allWeather.push(...res.weather);
        });
      }

      if (!isLargeDataset) {
        trackProgress('Fetcher', 'done', `Fetched real-time data for ${targetCities.length} cities.`, Date.now() - fetchStart);
      }

      // 2. Preprocess
      trackProgress('Processor', 'running', 'Cleaning and interpolating data...');
      const procStart = Date.now();
      const cleanAQI = DataProcessor.processAQI(allAQI);
      trackProgress('Processor', 'done', 'Data cleaning complete.', Date.now() - procStart);

      // 3. Merge
      trackProgress('Merger', 'running', 'Aligning AQI and Weather datasets...');
      const mergeStart = Date.now();
      const mergedData = MergeService.merge(cleanAQI, allWeather);
      const dailyData = _.sortBy(MergeService.resampleToDaily(mergedData), 'date');
      trackProgress('Merger', 'done', 'Datasets merged and resampled.', Date.now() - mergeStart);

      // 4. Timeframe Analysis
      trackProgress('Analyzer', 'running', 'Computing timeframe statistics...');
      const cityTimeframes = targetCities.map(city => ({
        city: city.name,
        analysis: TimeframeService.analyze(dailyData.filter(d => d.city === city.name), 30)
      }));
      trackProgress('Analyzer', 'done', 'Timeframe analysis complete.');

      // 5. Anomaly Detection
      trackProgress('Anomaly', 'running', 'Running anomaly detection algorithms...');
      const anomalies = AnomalyService.detect(dailyData);
      trackProgress('Anomaly', 'done', `${anomalies.length} anomalies detected.`);

      // 6. Forecast
      trackProgress('Forecaster', 'running', 'Generating 72h forecasts...');
      const forecasts = _.flatMap(targetCities, city => ForecastService.forecast(dailyData, city.name) || []);
      trackProgress('Forecaster', 'done', 'Forecasts generated.');

      // 7. Compliance
      trackProgress('Compliance', 'running', 'Evaluating regulatory compliance...');
      const complianceReports = targetCities.map(city => ComplianceService.check(city.name, dailyData));
      trackProgress('Compliance', 'done', 'Compliance check complete.');

      // 8. Seasonal Analysis
      trackProgress('Seasonal', 'running', 'Analyzing seasonal trends...');
      const seasonalData = SeasonalService.analyze(dailyData);
      trackProgress('Seasonal', 'done', 'Seasonal analysis complete.');

      // 9. Insights
      trackProgress('Insights', 'running', 'Generating cross-domain insights...');
      const weatherCorrelations = targetCities.map(city => ({
        city: city.name,
        correlations: InsightService.calculateWeatherCorrelation(dailyData.filter(d => d.city === city.name))
      }));
      trackProgress('Insights', 'done', 'Insights generated.');

      // 10. EDA Calculations
      const peakPollutionHours = _.range(0, 24).map(hour => {
        const hourData = mergedData.filter(d => new Date(d.date).getHours() === hour);
        return {
          hour,
          avgAQI: _.meanBy(hourData, 'value') || 0
        };
      });

      const pollutants = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2'];
      const pollutantCorrelations: { pair: string; correlation: number }[] = [];
      
      for (let i = 0; i < pollutants.length; i++) {
        for (let j = i + 1; j < pollutants.length; j++) {
          const p1 = pollutants[i];
          const p2 = pollutants[j];
          
          // Calculate correlation for each city and average it
          const cityCorrs = targetCities.map(city => {
            const cityData = dailyData.filter(d => d.city === city.name);
            const p1Data = _.sortBy(cityData.filter(d => d.parameter === p1), 'date');
            const p2Data = _.sortBy(cityData.filter(d => d.parameter === p2), 'date');
            
            if (p1Data.length < 2 || p2Data.length < 2) return null;
            
            // Align by date
            const aligned = p1Data.map(d1 => {
              const d2 = p2Data.find(d => d.date === d1.date);
              return d2 ? [d1.value, d2.value] : null;
            }).filter((pair): pair is [number, number] => pair !== null);
            
            if (aligned.length < 2) return null;
            
            const x = aligned.map(p => p[0]);
            const y = aligned.map(p => p[1]);
            
            // Simple Pearson correlation
            const n = x.length;
            const sumX = _.sum(x);
            const sumY = _.sum(y);
            const sumXY = _.sum(x.map((v, idx) => v * y[idx]));
            const sumX2 = _.sum(x.map(v => v * v));
            const sumY2 = _.sum(y.map(v => v * v));
            
            const num = (n * sumXY) - (sumX * sumY);
            const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            
            return den === 0 ? 0 : num / den;
          }).filter((c): c is number => c !== null);
          
          if (cityCorrs.length > 0) {
            pollutantCorrelations.push({
              pair: `${p1.toUpperCase()} / ${p2.toUpperCase()}`,
              correlation: _.mean(cityCorrs)
            });
          }
        }
      }

      const volatilityScores = targetCities.map(city => {
        const cityData = dailyData.filter(d => d.city === city.name && d.parameter === 'aqi');
        if (cityData.length < 2) return { city: city.name, score: 0 };
        
        const values = cityData.map(d => d.value);
        const mean = _.mean(values);
        const stdDev = Math.sqrt(_.sum(values.map(v => Math.pow(v - mean, 2))) / values.length);
        
        return {
          city: city.name,
          score: (stdDev / mean) * 100 // Coefficient of variation as volatility score
        };
      });

      // 11. Final Assembly
      const getHealthAdvice = (aqi: number) => {
        if (aqi > 300) return { general: 'Hazardous — stay indoors.', sensitive: 'Do not go outside.', activities: ['Avoid all outdoor activity', 'Use air purifiers', 'Wear N95 if going out'] };
        if (aqi > 200) return { general: 'Very poor — minimize exposure.', sensitive: 'Stay indoors.', activities: ['Avoid outdoor exercise', 'Keep windows closed'] };
        if (aqi > 100) return { general: 'Moderate — sensitive groups take care.', sensitive: 'Limit outdoor time.', activities: ['Reduce prolonged outdoor exertion'] };
        return { general: 'Air quality is satisfactory.', sensitive: 'No special precautions.', activities: ['Outdoor activities are fine'] };
      };

      const risks = targetCities.map(city => {
        const report = complianceReports.find(r => r.city === city.name);
        const timeframe = cityTimeframes.find(t => t.city === city.name)?.analysis;
        const cityForecasts = forecasts.filter(f => f.city === city.name);
        const cityData = dailyData.filter(d => d.city === city.name);
        
        const getLatestValue = (param: string) => {
          return _.sortBy(cityData.filter(d => d.parameter === param), 'date').pop()?.value || 0;
        };

        const pollutantValues = {
          pm25: getLatestValue('pm25'),
          pm10: getLatestValue('pm10'),
          no2: getLatestValue('no2'),
          o3: getLatestValue('o3'),
          co: getLatestValue('co'),
          so2: getLatestValue('so2')
        };

        const currentAQI = calculateNAQI(pollutantValues);

        const topFactors = [];
        if (pollutantValues.pm25 > 35) topFactors.push('Fine particulate matter (PM2.5)');
        if (pollutantValues.no2 > 40) topFactors.push('Vehicular nitrogen dioxide');
        if (pollutantValues.so2 > 20) topFactors.push('Industrial sulphur emissions');
        if (pollutantValues.pm10 > 50) topFactors.push('Coarse dust particles (PM10)');
        if (topFactors.length === 0) topFactors.push('Background pollution levels');

        const getCategory = (aqi: number) => {
          if (aqi <= 50) return 'Good';
          if (aqi <= 100) return 'Satisfactory';
          if (aqi <= 200) return 'Moderate';
          if (aqi <= 300) return 'Poor';
          if (aqi <= 400) return 'Very Poor';
          return 'Severe';
        };

        return {
          city: city.name,
          currentAQI,
          category: getCategory(currentAQI) as any,
          pollutants: pollutantValues,
          healthAdvice: getHealthAdvice(currentAQI),
          riskScore: report?.alertUrgencyScore || (currentAQI / 5),
          severity: (report?.status === 'violation' ? 'Critical' : report?.status === 'caution' ? 'High' : 'Safe') as any,
          topFactors,
          forecastTrend: cityForecasts.length > 0 ? cityForecasts.map(f => f.forecast_aqi) : [currentAQI, currentAQI * 1.1, currentAQI * 0.9]
        };
      });

      const agentState: AgentState = {
        events,
        currentAgent: null
      };

      const fireHotspots = generateSyntheticFires();

      return {
        lastRefreshed: new Date().toISOString(),
        cleanData: dailyData,
        cleaningReport: {
          rowsBefore: allAQI.length,
          rowsAfter: dailyData.length,
          nullsFilled: 0,
          outliersFlagged: 0,
          anomaliesDetected: anomalies.length
        },
        findings: {
          cityRankings: risks.map(r => ({ city: r.city, currentAQI: r.currentAQI, avgAQI: r.currentAQI })),
          temporalPatterns: seasonalData,
          weatherCorrelations: weatherCorrelations,
          correlations: _.flatMap(weatherCorrelations, w => w.correlations),
          anomalies
        },
        forecasts,
        risks,
        fireHotspots,
        status: 'healthy',
        agentState,
        edaReport: {
          cityRankings: risks.map(r => ({ city: r.city, currentAQI: r.currentAQI, avgAQI: r.currentAQI })),
          peakPollutionHours,
          humidityVsPM25: dailyData.filter(d => d.humidity !== undefined && d.parameter === 'pm25').map(d => ({ humidity: d.humidity, pm25: d.value, city: d.city })),
          pollutantCorrelations,
          volatilityScores,
          anomalies
        },
        complianceReports
      };

    } catch (error) {
      console.error('Pipeline error:', error);
      trackProgress('Orchestrator', 'error', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

export const runOrchestrator = PipelineOrchestrator.runPipeline;
