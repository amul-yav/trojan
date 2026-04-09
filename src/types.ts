import { INDIAN_CITIES } from './data/indian_cities';

export interface City {
  name: string;
  lat: number;
  lon: number;
  state?: string;
  district?: string;
  population?: number;
  pincode?: string;
}

export const CITIES: City[] = INDIAN_CITIES;

export interface AQIMeasurement {
  city: string;
  parameter: string;
  value: number;
  unit: string;
  date: string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  precipitation: number;
  timestamp: string;
}

export interface FireHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number;
  acq_date: string;
  state: string;
}

export interface Anomaly {
  timestamp: string;
  city: string;
  pollutant: string;
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  possibleCause: string;
  anomalyType: 'real_event' | 'sensor_fault' | 'unknown';
  rateOfChange: number;
}

export interface ForecastData {
  date: string;
  city: string;
  forecast_aqi: number;
  lower_bound: number;
  upper_bound: number;
  crisis_predicted: boolean;
  forecastConfidence: number;
}

export type AQICategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface HealthAdvice {
  general: string;
  sensitive: string;
  activities: string[];
}

export interface CorrelationData {
  factorA: string;
  factorB: string;
  coefficient: number;
  significance: 'High' | 'Medium' | 'Low';
  insight: string;
}

export interface ThresholdConfig {
  country: string;
  standard: 'WHO' | 'National' | 'Calibrated';
  pollutantThresholds: {
    pm25: number;
    pm10: number;
    no2: number;
  };
}

export interface CityRisk {
  city: string;
  currentAQI: number;
  category: AQICategory;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    so2: number;
  };
  healthAdvice: HealthAdvice;
  riskScore: number;
  severity: 'Safe' | 'Moderate' | 'High' | 'Critical';
  topFactors: string[];
  forecastTrend: number[];
}

export type UserRole = 'Municipal Officer' | 'District Collector' | 'State Environment Board' | 'Central Ministry';

export interface Jurisdiction {
  type: 'City' | 'District' | 'State' | 'National';
  name: string;
}

export interface UserContext {
  role: UserRole;
  jurisdiction: Jurisdiction;
  thresholds?: ThresholdConfig;
}

// Agent activity tracking
export interface AgentEvent {
  agentName: string;
  status: 'running' | 'done' | 'error';
  message: string;
  timestamp: string;
  durationMs?: number;
}

export interface AgentState {
  events: AgentEvent[];
  currentAgent: string | null;
}

// Compliance
export interface PollutantViolation {
  pollutant: string;
  value: number;
  whoThreshold: number;
  naaqsThreshold: number;
  exceedancePercent: number;
}

export interface ComplianceReport {
  city: string;
  status: 'safe' | 'caution' | 'violation';
  violations: PollutantViolation[];
  alertUrgencyScore: number;       // 0–100
  populationAtRisk: number;        // estimated thousands
  persistenceScore: number;        // 0–100
  recoveryTimeHours: number;
}

// EDA report
export interface EDAReport {
  cityRankings: { city: string; avgAQI: number; currentAQI: number }[];
  peakPollutionHours: { hour: number; avgAQI: number }[];
  humidityVsPM25: { humidity: number; pm25: number; city: string }[];
  pollutantCorrelations: { pair: string; correlation: number }[];
  volatilityScores: { city: string; score: number }[];
  anomalies: Anomaly[];
}

export interface PipelineResults {
  lastRefreshed: string;
  cleanData: any[];
  cleaningReport: {
    rowsBefore: number;
    rowsAfter: number;
    nullsFilled: number;
    outliersFlagged: number;
    anomaliesDetected: number;
  };
  findings: {
    cityRankings: any[];
    temporalPatterns: any;
    weatherCorrelations: any;
    correlations: CorrelationData[];
    anomalies: Anomaly[];
  };
  forecasts: ForecastData[];
  risks: CityRisk[];
  fireHotspots: FireHotspot[];
  status: 'healthy' | 'cached';
  agentState: AgentState;
  edaReport: EDAReport;
  complianceReports: ComplianceReport[];
}

export type AlertTriggerType =
  | 'aqi_spike'
  | 'compliance_violation'
  | 'ozone_breach'
  | 'no2_breach'
  | 'so2_breach'
  | 'pm25_breach'
  | 'sensor_fault_cluster'
  | 'forecast_crisis';

export interface AlertThresholds {
  aqiSpike: number;           // default 200
  rateOfChangePercent: number; // default 30 — triggers on rapid rise
  ozone: number;               // µg/m³, default 100 (WHO)
  no2: number;                 // µg/m³, default 25
  so2: number;                 // µg/m³, default 40
  pm25: number;                // µg/m³, default 15
  urgencyScoreMin: number;     // compliance urgency, default 50
  forecastCrisisAQI: number;   // default 300
}

export interface AlertRule {
  id: string;
  triggerType: AlertTriggerType;
  enabled: boolean;
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';
  onlyRealEvents?: boolean; // skip sensor_fault anomalies
}

export interface EmailConfig {
  serviceId: string;    // EmailJS service ID
  templateId: string;   // EmailJS template ID
  publicKey: string;    // EmailJS public key
  recipientEmail: string;
  recipientName: string;
}

export interface AlertRecord {
  id: string;
  triggeredAt: string;
  triggerType: AlertTriggerType;
  city: string;
  pollutant?: string;
  value?: number;
  message: string;
  emailSent: boolean;
  emailError?: string;
}
