import React, { useState, useEffect } from 'react';
import { PipelineResults, UserContext } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { generateCrisisAlert } from '../services/gemini';
import { Loader2, FileText, Wind, Thermometer, Droplets } from 'lucide-react';
import _ from 'lodash';

interface CityAnalysisProps {
  results: PipelineResults;
  userContext: UserContext | null;
  initialCity?: string | null;
}

export default function CityAnalysis({ results, userContext, initialCity }: CityAnalysisProps) {
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (initialCity) return initialCity;
    if (userContext?.jurisdiction.type === 'City') {
      const city = results.risks.find(r => r.city === userContext.jurisdiction.name);
      if (city) return city.city;
    }
    return results.risks[0]?.city || '';
  });

  useEffect(() => {
    if (initialCity) {
      setSelectedCity(initialCity);
      setAdvisory(null);
    }
  }, [initialCity]);
  const [searchTerm, setSearchTerm] = useState('');
  const [advisory, setAdvisory] = useState<string | null>(null);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  const filteredCities = results.risks.filter(r => 
    r.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cityRisk = results.risks.find(r => r.city === selectedCity) || results.risks[0];
  if (!cityRisk) return null;
  const cityForecasts = results.forecasts.filter(f => f.city === selectedCity);
  const cityData = _.findLast(results.cleanData, d => d.city === selectedCity && d.temperature !== undefined);

  const handleGenerateAdvisory = async () => {
    setLoadingAdvisory(true);
    const peakAQI = Math.max(...cityRisk.forecastTrend);
    const text = await generateCrisisAlert(selectedCity, cityRisk.riskScore, peakAQI, cityRisk.topFactors);
    setAdvisory(text);
    setLoadingAdvisory(false);
  };

  const riskData = [
    { name: 'Risk', value: cityRisk.riskScore },
    { name: 'Remaining', value: 100 - cityRisk.riskScore }
  ];

  const COLORS = [
    cityRisk.severity === 'Critical' ? '#ef4444' : 
    cityRisk.severity === 'High' ? '#f97316' : 
    cityRisk.severity === 'Moderate' ? '#eab308' : '#22c55e',
    '#f1f5f9'
  ];

  return (
    <div className="space-y-8">
      {/* City Selector */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">City Analysis</h2>
          <p className="text-sm text-slate-500">Detailed environmental breakdown and forecasting</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <input 
              type="text"
              placeholder="Search city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <select 
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setAdvisory(null);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 cursor-pointer"
          >
            {filteredCities.map(r => <option key={r.city} value={r.city}>{r.city}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AQI Status */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: COLORS[0] }} />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Current Air Quality</h3>
          <div className="relative w-52 h-52 flex items-center justify-center">
            <div className="text-center z-10">
              <div className={`text-6xl font-black tracking-tighter ${
                cityRisk.currentAQI > 400 ? 'text-naqi-severe' : 
                cityRisk.currentAQI > 300 ? 'text-naqi-verypoor' : 
                cityRisk.currentAQI > 200 ? 'text-naqi-poor' : 
                cityRisk.currentAQI > 100 ? 'text-naqi-moderate' : 'text-naqi-good'
              }`}>
                {Math.round(cityRisk.currentAQI)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">AQI Index</div>
            </div>
            {/* Simple Gauge Visual */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle 
                cx="104" cy="104" r="90" 
                fill="none" stroke="#f1f5f9" strokeWidth="12" 
              />
              <circle 
                cx="104" cy="104" r="90" 
                fill="none" stroke={COLORS[0]} strokeWidth="12" 
                strokeDasharray="565.48"
                strokeDashoffset={565.48 - (565.48 * Math.min(500, cityRisk.currentAQI) / 500)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
          <div className="mt-8">
            <p className={`text-xl font-black uppercase tracking-tight ${
               cityRisk.currentAQI > 400 ? 'text-naqi-severe' : 
               cityRisk.currentAQI > 300 ? 'text-naqi-verypoor' : 
               cityRisk.currentAQI > 200 ? 'text-naqi-poor' : 
               cityRisk.currentAQI > 100 ? 'text-naqi-moderate' : 'text-naqi-good'
            }`}>{cityRisk.category}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Based on Indian NAQI standards</p>
          </div>
        </div>

        {/* Pollutant Breakdown */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Pollutant Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <PollutantCard label="PM2.5" value={cityRisk.pollutants.pm25} unit="µg/m³" max={500} />
            <PollutantCard label="PM10" value={cityRisk.pollutants.pm10} unit="µg/m³" max={500} />
            <PollutantCard label="NO2" value={cityRisk.pollutants.no2} unit="µg/m³" max={400} />
            <PollutantCard label="O3" value={cityRisk.pollutants.o3} unit="µg/m³" max={200} />
            <PollutantCard label="CO" value={cityRisk.pollutants.co} unit="mg/m³" max={10} />
            <PollutantCard label="SO2" value={cityRisk.pollutants.so2} unit="µg/m³" max={400} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 7-Day Forecast */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Short-Horizon Forecast (TFT/Prophet)</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
              <span className="text-[10px] font-bold text-slate-500 uppercase">24-72h Forecast · Shaded = confidence band</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cityForecasts}>
                <defs>
                  <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.12}/>
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.03}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={600}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  fontWeight={600}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <p style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                        <p style={{ color: COLORS[0], fontWeight: 700, fontSize: 13 }}>AQI {Math.round(d.forecast_aqi)}</p>
                        <p style={{ color: '#94a3b8', fontSize: 11 }}>Range: {Math.round(d.lower_bound)} – {Math.round(d.upper_bound)}</p>
                        <p style={{ color: '#94a3b8', fontSize: 11 }}>Confidence: {Math.round(d.forecastConfidence)}%</p>
                      </div>
                    );
                  }}
                />
                {/* Upper confidence bound — filled area */}
                <Area
                  type="monotone"
                  dataKey="upper_bound"
                  stroke="none"
                  fill={`url(#colorBand)`}
                  fillOpacity={1}
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
                {/* Lower confidence bound — white fill to cut out the bottom of the band */}
                <Area
                  type="monotone"
                  dataKey="lower_bound"
                  stroke="none"
                  fill="white"
                  fillOpacity={1}
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast_aqi" 
                  stroke={COLORS[0]} 
                  fillOpacity={1} 
                  fill="url(#colorAqi)" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: COLORS[0], strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Breakdown */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Risk Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round(cityRisk.riskScore)}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Risk Score</p>
              </div>
            </div>
            <div className="space-y-5">
              <p className="text-sm font-bold text-slate-800 mb-2">Key Risk Drivers:</p>
              {cityRisk.topFactors.map((factor, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weather Correlation */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Meteorological Impact</h3>
          <div className="grid grid-cols-3 gap-6 mb-10">
            <WeatherMetric icon={Thermometer} label="Temp" value={`${Math.round(cityData?.temperature || 0)}°C`} />
            <WeatherMetric icon={Wind} label="Wind" value={`${Math.round(cityData?.windSpeed || 0)} km/h`} />
            <WeatherMetric icon={Droplets} label="Humidity" value={`${Math.round(cityData?.humidity || 0)}%`} />
          </div>
          
          <div className="space-y-4 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Relevant Correlations</p>
            {results.findings.correlations.slice(0, 2).map((corr, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{corr.factorA} vs {corr.factorB}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    corr.significance === 'High' ? 'bg-red-100 text-red-600' : 
                    corr.significance === 'Medium' ? 'bg-orange-100 text-orange-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      corr.significance === 'High' ? 'bg-red-600' : 
                      corr.significance === 'Medium' ? 'bg-orange-600' : 
                      'bg-blue-600'
                    }`} />
                    {corr.significance}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 italic leading-tight">{corr.insight}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-start gap-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <Wind size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">AI Prediction Insight</p>
              <p className="text-sm font-medium leading-relaxed">
                {cityData?.windSpeed && cityData.windSpeed < 10 
                  ? "Atmospheric stagnation detected. Low wind speeds are preventing pollutant dispersal, leading to localized accumulation." 
                  : "High humidity levels are currently acting as a particulate trap, increasing the effective concentration of surface-level pollutants."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Government Advisory */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <FileText className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">AI Policy Advisory</h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Generative intelligence for environmental policy</p>
            </div>
          </div>
          <button 
            onClick={handleGenerateAdvisory}
            disabled={loadingAdvisory}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            {loadingAdvisory ? <Loader2 size={14} className="animate-spin" /> : "Generate Report"}
          </button>
        </div>
        <div className="p-10 min-h-[250px] flex items-center justify-center bg-slate-50/30">
          {advisory ? (
            <div className="max-w-4xl w-full">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-sm">
                {advisory}
              </div>
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={32} className="text-slate-300" />
              </div>
              <h4 className="text-slate-900 font-bold mb-2">No Advisory Generated</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Click the button above to generate a comprehensive AI-powered policy and health recommendation report for {selectedCity}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeatherMetric({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center hover:border-blue-100 transition-colors">
      <Icon size={20} className="mx-auto mb-2 text-blue-600" />
      <div className="text-lg font-black text-slate-900 tracking-tight">{value}</div>
      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{label}</div>
    </div>
  );
}

function PollutantCard({ label, value, unit, max }: any) {
  const getPollutantColor = (val: number, type: string) => {
    if (type === 'CO') return val > 5 ? 'bg-naqi-verypoor' : 'bg-naqi-good';
    return val > 300 ? 'bg-naqi-severe' : val > 100 ? 'bg-naqi-moderate' : 'bg-naqi-good';
  };

  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
        <span className="text-[10px] text-slate-400 font-bold">{unit}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-black text-slate-900 tracking-tighter">{Math.round(value * 10) / 10}</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${getPollutantColor(value, label)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
