import React, { useState, useRef } from 'react';
import { PipelineResults, UserContext, AlertRecord } from '../types';
import { generateMorningBriefing } from '../services/gemini';
import {
  FileText, Loader2, History, ChevronDown,
  CheckCircle2, AlertTriangle, ShieldCheck, Wind,
  Thermometer, Droplets, TrendingUp, TrendingDown, Minus,
  Download
} from 'lucide-react';
import _ from 'lodash';

interface ReportsProps {
  results: PipelineResults;
  userContext: UserContext | null;
}

// Helper functions
function getAQIColor(aqi: number): { bg: string; text: string; label: string } {
  if (aqi > 400) return { bg: 'bg-red-600',    text: 'text-white',      label: 'Severe' };
  if (aqi > 300) return { bg: 'bg-red-500',    text: 'text-white',      label: 'Very Poor' };
  if (aqi > 200) return { bg: 'bg-orange-500', text: 'text-white',      label: 'Poor' };
  if (aqi > 100) return { bg: 'bg-yellow-400', text: 'text-slate-900',  label: 'Moderate' };
  if (aqi > 50)  return { bg: 'bg-lime-400',   text: 'text-slate-900',  label: 'Satisfactory' };
  return             { bg: 'bg-green-500',  text: 'text-white',      label: 'Good' };
}

function getStatusBadge(status: 'safe' | 'caution' | 'violation' | string) {
  if (status === 'violation') return { bg: 'bg-red-100',    text: 'text-red-700',    label: 'VIOLATION' };
  if (status === 'caution')   return { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'CAUTION' };
  return                             { bg: 'bg-green-100',  text: 'text-green-700',  label: 'SAFE' };
}

function getSeverityDot(severity: string) {
  if (severity === 'Critical' || severity === 'critical') return 'bg-red-500';
  if (severity === 'High'     || severity === 'high')     return 'bg-orange-500';
  if (severity === 'Moderate' || severity === 'medium')   return 'bg-yellow-400';
  return 'bg-green-500';
}

// WHO thresholds for the pollutant status dots
const WHO: Record<string, number> = { pm25: 15, pm10: 45, no2: 25, o3: 100, so2: 40, co: 4 };

export default function Reports({ results, userContext }: ReportsProps) {
  const [briefing, setBriefing]       = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [agentStage, setAgentStage]   = useState<'research' | 'analysis' | 'policy' | null>(null);
  const [history, setHistory]         = useState<{ date: string; content: string }[]>([]);
  const reportRef                     = useRef<HTMLDivElement>(null);

  // Pick the highest-risk city for the report, or the user's jurisdiction city
  const topCity = userContext?.jurisdiction.type === 'City'
    ? results.risks.find(r => r.city === userContext.jurisdiction.name) || results.risks[0]
    : results.risks.reduce((a, b) => a.riskScore > b.riskScore ? a : b, results.risks[0]);

  const cityForecasts   = results.forecasts.filter(f => f.city === topCity?.city);
  const cityCompliance  = results.complianceReports.find(r => r.city === topCity?.city);
  const cityAnomalies   = results.findings.anomalies.filter(a => a.city === topCity?.city).slice(0, 4);

  // Wind from cleanData
  const windRow = _.findLast(results.cleanData, (d: any) =>
    d.city === topCity?.city && d.windSpeed !== undefined
  ) as any;
  const windSpeed = windRow?.windSpeed ?? null;
  const humidity  = windRow?.humidity  ?? null;
  const temp      = windRow?.temperature ?? null;

  // Trend: is AQI rising or falling?
  const forecastValues = cityForecasts.map(f => f.forecast_aqi);
  const trendDirection = forecastValues.length >= 2
    ? forecastValues[forecastValues.length - 1] > forecastValues[0] ? 'up'
    : forecastValues[forecastValues.length - 1] < forecastValues[0] ? 'down'
    : 'flat'
    : 'flat';

  // Peak pollution hour
  const peakHourEntry = _.maxBy(results.edaReport.peakPollutionHours, 'avgAQI');
  const peakHour = peakHourEntry ? `${peakHourEntry.hour}:00` : 'N/A';

  const reportId  = useRef(`ECO-${Math.random().toString(36).substr(2,9).toUpperCase()}`);
  const now       = new Date();

  const handleGenerateBriefing = async () => {
    setLoading(true);
    setAgentStage('research');
    await new Promise(r => setTimeout(r, 1500));
    setAgentStage('analysis');
    await new Promise(r => setTimeout(r, 1500));
    setAgentStage('policy');
    
    const text = await generateMorningBriefing(results.risks, userContext?.role);
    setBriefing(text);
    setHistory(prev => [{ date: new Date().toLocaleString(), content: text }, ...prev.slice(0, 2)]);
    setLoading(false);
    setAgentStage(null);
  };

  const downloadReport = () => {
    if (!briefing) return;
    const blob = new Blob([briefing], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ecosentinel_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">

      {/* ── SCREEN-ONLY CONTROLS (hidden on print) ── */}
      <div className="print:hidden space-y-8">

        {/* Demo mode banner */}
        {!import.meta.env.VITE_GEMINI_API_KEY && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Demo mode — AI summary uses a template. Add VITE_GEMINI_API_KEY for live generation.</span>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Environmental Analysis Report
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {topCity?.city} · {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateBriefing}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            {briefing && (
              <button
                onClick={downloadReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-lg"
              >
                <Download size={20} />
                Download Report
              </button>
            )}
          </div>
        </div>

        {/* Agent progress */}
        {loading && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">AI Agent Pipeline</p>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100" />
              <AgentStep label="Research"  active={agentStage === 'research'}  completed={agentStage === 'analysis' || agentStage === 'policy'} />
              <AgentStep label="Analysis"  active={agentStage === 'analysis'}  completed={agentStage === 'policy'} />
              <AgentStep label="Policy"    active={agentStage === 'policy'}    completed={false} />
            </div>
            <p className="text-center text-xs font-semibold text-slate-500 animate-pulse">
              {agentStage === 'research' && 'Scanning correlations and historical data...'}
              {agentStage === 'analysis' && 'Running short-horizon forecasts...'}
              {agentStage === 'policy'   && 'Calibrating policy mandates...'}
            </p>
          </div>
        )}
      </div>

      {/* ── PRINTABLE REPORT (visible on screen when briefing exists, always visible on print) ── */}
      {briefing && (
        <div ref={reportRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">

          {/* ── REPORT HEADER ── */}
          <div className="bg-slate-900 px-8 py-6 print:px-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EcoSentinel AI · Autonomous Environmental Intelligence</p>
                <h1 className="text-xl font-black text-white">Environmental Analysis Report</h1>
                <p className="text-slate-300 text-sm mt-1">{topCity?.city} — Comprehensive Air Quality & Risk Assessment</p>
              </div>
              <div className="text-right text-slate-400 text-xs space-y-1">
                <p className="font-bold text-white">{now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</p>
                <p className="font-mono text-[10px] text-slate-500 mt-2">{reportId.current}</p>
              </div>
            </div>
            {/* Prepared for row */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Prepared For</p>
                <p className="text-white text-xs font-semibold mt-0.5">{userContext?.role || 'Policy Maker'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Jurisdiction</p>
                <p className="text-white text-xs font-semibold mt-0.5">{userContext?.jurisdiction.name || 'National'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Data Window</p>
                <p className="text-white text-xs font-semibold mt-0.5">Last 7 days · {results.cleaningReport.rowsAfter} data points</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Anomalies Detected</p>
                <p className="text-white text-xs font-semibold mt-0.5">{results.cleaningReport.anomaliesDetected}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8 print:p-10">

            {/* ── SECTION 1: KEY METRICS GRID ── */}
            <section>
              <SectionHeader number="1" title="Current Environmental Conditions" />
              {topCity && (
                <>
                  {/* AQI Hero Card */}
                  <div className={`${getAQIColor(topCity.currentAQI).bg} rounded-xl p-5 mb-4 flex items-center justify-between`}>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${getAQIColor(topCity.currentAQI).text} opacity-80`}>Air Quality Index</p>
                      <p className={`text-5xl font-black ${getAQIColor(topCity.currentAQI).text} mt-1`}>{Math.round(topCity.currentAQI)}</p>
                      <p className={`text-sm font-bold ${getAQIColor(topCity.currentAQI).text} mt-1`}>{getAQIColor(topCity.currentAQI).label}</p>
                    </div>
                    <div className={`text-right ${getAQIColor(topCity.currentAQI).text}`}>
                      <p className="text-xs opacity-70">Risk Score</p>
                      <p className="text-3xl font-black">{Math.round(topCity.riskScore)}<span className="text-lg">/100</span></p>
                      <p className="text-xs font-bold mt-1 opacity-80">{topCity.severity}</p>
                    </div>
                  </div>

                  {/* Pollutant grid — 3 columns × 2 rows */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'PM2.5', value: topCity.pollutants.pm25, unit: 'µg/m³', key: 'pm25' },
                      { label: 'PM10',  value: topCity.pollutants.pm10,  unit: 'µg/m³', key: 'pm10' },
                      { label: 'NO₂',   value: topCity.pollutants.no2,   unit: 'µg/m³', key: 'no2' },
                      { label: 'O₃',    value: topCity.pollutants.o3,    unit: 'µg/m³', key: 'o3' },
                      { label: 'SO₂',   value: topCity.pollutants.so2,   unit: 'µg/m³', key: 'so2' },
                      { label: 'CO',    value: topCity.pollutants.co,    unit: 'mg/m³',  key: 'co' },
                    ].map(p => {
                      const threshold = WHO[p.key];
                      const exceeded = p.value > threshold;
                      return (
                        <div key={p.key} className={`rounded-xl p-4 border ${exceeded ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.label}</p>
                            <div className={`w-2 h-2 rounded-full ${exceeded ? 'bg-red-500' : 'bg-green-500'}`} />
                          </div>
                          <p className={`text-2xl font-black ${exceeded ? 'text-red-700' : 'text-slate-800'}`}>
                            {p.value < 10 ? p.value.toFixed(2) : Math.round(p.value)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.unit}</p>
                          {exceeded && (
                            <p className="text-[9px] font-bold text-red-600 mt-1">↑ {Math.round(((p.value - threshold) / threshold) * 100)}% above WHO</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Weather row */}
                  <div className="grid grid-cols-3 gap-3">
                    <WeatherCard icon={Wind}        label="Wind Speed"   value={windSpeed !== null ? `${windSpeed.toFixed(1)} m/s` : 'N/A'} note={windSpeed !== null && windSpeed < 2 ? 'Low — poor dispersion' : 'Moderate dispersion'} warn={windSpeed !== null && windSpeed < 2} />
                    <WeatherCard icon={Droplets}    label="Humidity"     value={humidity  !== null ? `${Math.round(humidity)}%`            : 'N/A'} note="Relative humidity" warn={false} />
                    <WeatherCard icon={Thermometer} label="Temperature"  value={temp      !== null ? `${Math.round(temp)}°C`               : 'N/A'} note="Ambient temperature" warn={false} />
                  </div>
                </>
              )}
            </section>

            {/* ── SECTION 2: TREND & FORECAST ── */}
            <section>
              <SectionHeader number="2" title="Trend Analysis & 72-Hour Forecast" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Trend direction card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pollution Trend</p>
                  <div className="flex items-center gap-3">
                    {trendDirection === 'up'   && <TrendingUp   size={32} className="text-red-500" />}
                    {trendDirection === 'down' && <TrendingDown size={32} className="text-green-500" />}
                    {trendDirection === 'flat' && <Minus        size={32} className="text-slate-400" />}
                    <div>
                      <p className={`text-lg font-black ${trendDirection === 'up' ? 'text-red-600' : trendDirection === 'down' ? 'text-green-600' : 'text-slate-600'}`}>
                        {trendDirection === 'up' ? 'Worsening' : trendDirection === 'down' ? 'Improving' : 'Stable'}
                      </p>
                      <p className="text-xs text-slate-500">Based on 72h forecast trajectory</p>
                    </div>
                  </div>
                </div>
                {/* Peak hour card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Peak Pollution Hour</p>
                  <p className="text-3xl font-black text-slate-900">{peakHour}</p>
                  <p className="text-xs text-slate-500 mt-1">Daily average across all cities</p>
                </div>
              </div>

              {/* Forecast table */}
              {cityForecasts.length > 0 ? (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Day</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Forecast AQI</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Range</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Crisis Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cityForecasts.map((f, i) => {
                        const aqiColors = getAQIColor(f.forecast_aqi);
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {new Date(f.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`${aqiColors.bg} ${aqiColors.text} px-2 py-0.5 rounded font-black text-xs`}>
                                {Math.round(f.forecast_aqi)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{Math.round(f.lower_bound)} – {Math.round(f.upper_bound)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-1.5 max-w-16">
                                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.round(f.forecastConfidence)}%` }} />
                                </div>
                                <span className="text-xs text-slate-500">{Math.round(f.forecastConfidence)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {f.crisis_predicted
                                ? <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Yes</span>
                                : <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">No</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No forecast data available for this city.</p>
              )}
            </section>

            {/* ── SECTION 3: RISK & COMPLIANCE ── */}
            <section>
              <SectionHeader number="3" title="Risk Assessment & Compliance Status" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Compliance badge */}
                {cityCompliance && (() => {
                  const badge = getStatusBadge(cityCompliance.status);
                  return (
                    <div className={`${badge.bg} rounded-xl p-5 border ${cityCompliance.status === 'violation' ? 'border-red-200' : cityCompliance.status === 'caution' ? 'border-amber-200' : 'border-green-200'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">WHO/NAAQS Compliance</p>
                      <p className={`text-2xl font-black ${badge.text}`}>{badge.label}</p>
                      <p className={`text-xs mt-1 ${badge.text} opacity-70`}>{cityCompliance.violations.length} pollutant{cityCompliance.violations.length !== 1 ? 's' : ''} in violation</p>
                    </div>
                  );
                })()}
                {/* Population at risk */}
                {cityCompliance && (
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Population at Risk</p>
                    <p className="text-2xl font-black text-slate-900">{cityCompliance.populationAtRisk.toLocaleString()}<span className="text-sm font-normal text-slate-500"> thousand</span></p>
                    <p className="text-xs text-slate-500 mt-1">Estimated recovery: {Math.round(cityCompliance.recoveryTimeHours)}h</p>
                  </div>
                )}
              </div>

              {/* Violations table */}
              {cityCompliance && cityCompliance.violations.length > 0 && (
                <div className="rounded-xl border border-red-200 overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Active Violations
                    </p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pollutant</th>
                        <th className="text-left px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Measured</th>
                        <th className="text-left px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">WHO Limit</th>
                        <th className="text-left px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">NAAQS Limit</th>
                        <th className="text-left px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Exceedance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cityCompliance.violations.map((v, i) => (
                        <tr key={i} className="bg-red-50/30">
                          <td className="px-4 py-3 font-black text-slate-900 uppercase text-xs">{v.pollutant}</td>
                          <td className="px-4 py-3 font-bold text-red-700">{v.value.toFixed(1)} µg/m³</td>
                          <td className="px-4 py-3 text-slate-500">{v.whoThreshold} µg/m³</td>
                          <td className="px-4 py-3 text-slate-500">{v.naaqsThreshold} µg/m³</td>
                          <td className="px-4 py-3">
                            <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                              +{Math.round(v.exceedancePercent)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {cityCompliance && cityCompliance.violations.length === 0 && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <ShieldCheck size={16} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-700">All monitored pollutants are within WHO and NAAQS limits.</p>
                </div>
              )}
            </section>

            {/* ── SECTION 4: AI BRIEFING ── */}
            <section>
              <SectionHeader number="4" title="AI Intelligence Briefing" />
              <div className="bg-slate-900 rounded-xl p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Generated by EcoSentinel Report Agent · {userContext?.role || 'Policy Maker'}</p>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{briefing}</p>
              </div>
            </section>

            {/* ── SECTION 5: HEALTH ADVISORY ── */}
            {topCity && (
              <section>
                <SectionHeader number="5" title="Health Advisory & Recommendations" />
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-1">General Public</p>
                    <p className="text-sm text-orange-900">{topCity.healthAdvice.general}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Sensitive Groups (Children, Elderly, Respiratory Conditions)</p>
                    <p className="text-sm text-red-900">{topCity.healthAdvice.sensitive}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Recommended Actions</p>
                    <ul className="space-y-1.5">
                      {topCity.healthAdvice.activities.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* ── SECTION 6: ANOMALIES ── */}
            {cityAnomalies.length > 0 && (
              <section>
                <SectionHeader number="6" title="Detected Anomalies" />
                <div className="space-y-2">
                  {cityAnomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <div className={`w-2 h-2 rounded-full ${getSeverityDot(a.severity)} mt-1.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-800 uppercase">{a.pollutant}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                            a.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            a.severity === 'high'     ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'}`}>{a.severity}</span>
                          <span className="text-[9px] font-semibold text-slate-500 uppercase">
                            {a.anomalyType === 'real_event' ? '· Environmental Event' : a.anomalyType === 'sensor_fault' ? '· Sensor Fault' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{a.possibleCause}</p>
                      </div>
                      <span className="text-sm font-black text-slate-700 flex-shrink-0">{a.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── REPORT FOOTER ── */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span>Generated by EcoSentinel AI · Autonomous Environmental Intelligence System</span>
              <span>{reportId.current} · Confidential — For Official Use Only</span>
            </div>

          </div>
        </div>
      )}

      {/* ── REPORT HISTORY (screen only) ── */}
      {history.length > 0 && (
        <div className="print:hidden space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History size={14} /> Recent Reports
          </h3>
          {history.map((item, idx) => (
            <details key={idx} className="bg-white border border-slate-200 rounded-xl group overflow-hidden">
              <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-slate-50 list-none">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-1.5 rounded-lg"><FileText size={14} className="text-slate-500" /></div>
                  <span className="text-sm font-semibold text-slate-700">{item.date}</span>
                </div>
                <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 border-t border-slate-100 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 pt-4">
                {item.content}
              </div>
            </details>
          ))}
        </div>
      )}

    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-black flex-shrink-0">
        {number}
      </div>
      <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{title}</h3>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function WeatherCard({ icon: Icon, label, value, note, warn }: {
  icon: any; label: string; value: string; note: string; warn: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${warn ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={warn ? 'text-amber-600' : 'text-slate-400'} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-2xl font-black ${warn ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
      <p className={`text-[10px] mt-0.5 ${warn ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>{note}</p>
    </div>
  );
}

function AgentStep({ label, active, completed }: { label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 relative z-10">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
        completed ? 'bg-green-500 border-green-500 text-white' :
        active    ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg' :
                    'bg-white border-slate-200 text-slate-300'}`}>
        {completed ? <CheckCircle2 size={18} /> : <div className="w-2 h-2 rounded-full bg-current" />}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${
        active ? 'text-blue-600' : completed ? 'text-green-600' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}
