import React, { useState } from 'react';
import { PipelineResults } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, ScatterChart, Scatter, ZAxis, LineChart, Line, Legend
} from 'recharts';
import { BarChart2, Zap, Activity, TrendingUp, Loader2, FileText } from 'lucide-react';
import { ReportAgent } from '../agents/reportAgent';
import _ from 'lodash';

interface EDAExplorerProps {
  results: PipelineResults;
}

export default function EDAExplorer({ results }: EDAExplorerProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const eda = results.edaReport;

  const handleGetSummary = async () => {
    setLoadingSummary(true);
    const text = await ReportAgent.generateEDASummary(eda);
    setSummary(text);
    setLoadingSummary(false);
  };

  const getAQIColor = (aqi: number) => {
    if (aqi > 300) return '#b91c1c';
    if (aqi > 200) return '#f97316';
    if (aqi > 100) return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <BarChart2 className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Environmental Data Analysis (EDA)</h2>
            <p className="text-sm text-slate-500">Uncovering hidden patterns and cross-domain correlations</p>
          </div>
        </div>
        <button 
          onClick={handleGetSummary}
          disabled={loadingSummary}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm"
        >
          {loadingSummary ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          AI Data Summary
        </button>
      </div>

      {summary && (
        <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/20 p-2 rounded-lg shrink-0">
            <Zap size={20} className="text-white" />
          </div>
          <p className="text-sm font-bold leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel 1 — Peak pollution hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Peak Pollution Hours (24h Cycle)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.peakPollutionHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} tickFormatter={(h) => `${h}:00`} />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}
                />
                <Bar dataKey="avgAQI" radius={[4, 4, 0, 0]}>
                  {eda.peakPollutionHours.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getAQIColor(entry.avgAQI)} />
                  ))}
                </Bar>
                <ReferenceLine x={_.maxBy(eda.peakPollutionHours, 'avgAQI')?.hour} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Peak', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2 — Humidity vs PM2.5 scatter plot */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Humidity vs PM2.5 Correlation</h3>
          <div className="h-[300px] w-full">
            {eda.humidityVsPM25.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm text-center px-8 font-medium">
                No correlated weather + pollutant data available for this session.<br/>
                Using live API data will populate this chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="humidity" name="Humidity" unit="%" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="pm25" name="PM2.5" unit="µg/m³" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                  <ZAxis type="category" dataKey="city" name="City" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px' }} />
                  <Scatter name="Data Points" data={eda.humidityVsPM25} fill="#3b82f6" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel 3 — Pollutant correlations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Pollutant Cross-Correlations (Pearson r)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.pollutantCorrelations} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[-1, 1]} stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <YAxis dataKey="pair" type="category" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}
                />
                <Bar dataKey="correlation" radius={[0, 4, 4, 0]} barSize={24}>
                  {eda.pollutantCorrelations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.correlation > 0 ? '#14b8a6' : '#fb7185'} />
                  ))}
                </Bar>
                <ReferenceLine x={0} stroke="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 4 — City volatility scores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">City Volatility Index (AQI Variance)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={_.sortBy(eda.volatilityScores, 'score').reverse()} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <YAxis dataKey="city" type="category" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}
                />
                <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                <ReferenceLine x={30} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'High Volatility', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
