import React, { useState } from 'react';
import { PipelineResults, UserContext } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { AlertCircle, Filter, Search, Clock } from 'lucide-react';

interface AnomalyLogProps {
  results: PipelineResults;
  userContext: UserContext | null;
}

export default function AnomalyLog({ results, userContext }: AnomalyLogProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  
  const anomalies = results.findings.anomalies.filter(a => 
    filter === 'all' ? true : a.severity === filter
  );

  const timelineData = results.cleanData.slice(-100).map(d => ({
    time: new Date(d.date).getTime(),
    value: d.value,
    city: d.city,
    isAnomaly: d.value > 200
  }));

  const mostAffectedCity = anomalies.length > 0 
    ? anomalies.reduce((acc: any, curr) => {
        acc[curr.city] = (acc[curr.city] || 0) + 1;
        return acc;
      }, {})
    : {};

  const topCity = Object.entries(mostAffectedCity).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';
  const peakValue = anomalies.length > 0 ? Math.max(...anomalies.map(a => a.value)) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-xl">
              <AlertCircle className="text-orange-600" />
            </div>
            Anomaly & Violation Log
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time detection of air quality violations and spikes</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['all', 'critical', 'high', 'medium'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Violation Timeline (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="time" 
              type="number" 
              domain={['auto', 'auto']}
              tickFormatter={(t) => new Date(t).toLocaleDateString()}
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
              labelFormatter={(t) => new Date(t).toLocaleString()}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              dot={(props: any) => {
                if (props.payload.isAnomaly) {
                  return <circle cx={props.cx} cy={props.cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
                }
                return null;
              }}
              strokeWidth={3}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Filter size={14} className="text-slate-400" />
            <span>Filtered Events ({anomalies.length})</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search cities..." 
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="p-5">Time</th>
                <th className="p-5">City</th>
                <th className="p-5">Pollutant</th>
                <th className="p-5">Value</th>
                <th className="p-5">Severity</th>
                <th className="p-5">Possible Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {anomalies.map((anomaly, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-400" />
                      {new Date(anomaly.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-5 font-bold text-slate-900">{anomaly.city}</td>
                  <td className="p-5 text-slate-500 font-bold text-xs">{anomaly.pollutant.toUpperCase()}</td>
                  <td className="p-5 font-black text-slate-900">{Math.round(anomaly.value)}</td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      anomaly.severity === 'critical' ? 'bg-red-50 text-red-600' :
                      anomaly.severity === 'high' ? 'bg-orange-50 text-orange-600' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>
                      {anomaly.severity}
                    </span>
                  </td>
                  <td className="p-5 text-xs text-slate-500 font-medium italic">
                    {anomaly.value > 350 ? "Industrial spike / Stubble burning" : "Stagnant weather conditions"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Total Anomalies (Jurisdiction)</p>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{anomalies.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Most Affected City</p>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{topCity}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Peak Anomaly Value</p>
          <div className="text-3xl font-black text-red-600 tracking-tighter">{Math.round(peakValue)} <span className="text-xs font-bold text-slate-400 uppercase ml-1">AQI</span></div>
        </div>
      </div>
    </div>
  );
}
