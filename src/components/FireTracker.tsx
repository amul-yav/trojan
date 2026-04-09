import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { PipelineResults, UserContext } from '../types';
import { Flame, AlertTriangle, Map as MapIcon, Info, Navigation } from 'lucide-react';

interface FireTrackerProps {
  results: PipelineResults;
  userContext: UserContext | null;
}

export default function FireTracker({ results, userContext }: FireTrackerProps) {
  const punjabFires = results.fireHotspots.filter(f => f.state === 'Punjab').length;
  const haryanaFires = results.fireHotspots.filter(f => f.state === 'Haryana').length;
  const highConfidence = results.fireHotspots.filter(f => f.confidence > 90).length;

  // Simulated village data for District Collector
  const villages = [
    { name: 'Kheri Gujran', count: 12, risk: 'High' },
    { name: 'Dhablan', count: 8, risk: 'Medium' },
    { name: 'Sanaur', count: 15, risk: 'High' },
    { name: 'Bhunerheri', count: 5, risk: 'Low' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-xl">
              <Flame className="text-red-600" />
            </div>
            Fire & Stubble Burning Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-1">Satellite monitoring for {userContext?.jurisdiction.name} jurisdiction</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatBox label="Total Hotspots" value={results.fireHotspots.length} color="red" />
          {userContext?.role === 'Central Ministry' && (
            <>
              <StatBox label="Punjab" value={punjabFires} color="orange" />
              <StatBox label="Haryana" value={haryanaFires} color="orange" />
            </>
          )}
          <StatBox label="High Confidence" value={highConfidence} color="red" />
        </div>
      </div>

      {userContext?.role === 'District Collector' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {villages.map(v => (
            <div key={v.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Village Cluster</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${v.risk === 'High' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                  {v.risk} Risk
                </span>
              </div>
              <h4 className="font-bold text-slate-900">{v.name}</h4>
              <div className="mt-3 flex items-center gap-2">
                <Flame size={14} className="text-orange-500" />
                <span className="text-lg font-black text-slate-900">{v.count}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hotspots</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(punjabFires + haryanaFires > 20 || results.fireHotspots.length > 10) && (
        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="animate-pulse w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">High Stubble Burning Activity Detected</p>
            <p className="text-xs font-medium opacity-80">
              {userContext?.role === 'Municipal Officer' 
                ? `Impact expected in ${userContext.jurisdiction.name} within 48-72 hours based on current wind trajectories.`
                : "Regional air quality impact expected in 48-72 hours based on current wind trajectories."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden h-[600px] shadow-sm relative">
          <MapContainer center={[25.5937, 78.9629]} zoom={userContext?.jurisdiction.type === 'National' ? 5 : 8} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {results.fireHotspots.map((fire, idx) => {
              if (fire.latitude === undefined || fire.longitude === undefined) return null;
              return (
                <CircleMarker 
                  key={idx}
                  center={[fire.latitude, fire.longitude]}
                  radius={Math.max(4, fire.brightness / 80)}
                  pathOptions={{ 
                    color: fire.confidence > 85 ? '#ef4444' : '#f97316', 
                    fillColor: fire.confidence > 85 ? '#ef4444' : '#f97316', 
                    fillOpacity: 0.7,
                    weight: 1
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[140px]">
                      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">{fire.state} Hotspot</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-slate-500 uppercase">Brightness</span>
                          <span className="text-slate-900">{Math.round(fire.brightness)}K</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-slate-500 uppercase">Confidence</span>
                          <span className={fire.confidence > 85 ? 'text-red-600' : 'text-orange-600'}>{Math.round(fire.confidence)}%</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-slate-500 uppercase">Date</span>
                          <span className="text-slate-900">{fire.acq_date}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          
          {userContext?.role === 'Central Ministry' && (
            <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Navigation size={14} className="text-blue-600" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pollution Drift Analysis</h4>
              </div>
              <p className="text-xs font-bold text-slate-700">Inter-state movement detected: <span className="text-red-600">Punjab → Delhi</span></p>
              <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-2/3 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-widest">Jurisdiction Hotspots</h3>
            <div className="bg-white p-1 rounded-lg border border-slate-200">
              <Info size={14} className="text-slate-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter">Location</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter">Brightness</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.fireHotspots.slice(0, 20).map((fire, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-bold text-slate-700">{fire.state}</td>
                    <td className="p-4 text-slate-500 font-medium">{Math.round(fire.brightness)}K</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${fire.confidence > 85 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                        {Math.round(fire.confidence)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: any) {
  const colorMap: any = {
    red: "text-red-600 bg-red-50 border-red-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
  };

  return (
    <div className={`border px-5 py-2.5 rounded-2xl text-center shadow-sm min-w-[120px] ${colorMap[color]}`}>
      <div className="text-xl font-black tracking-tight">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</div>
    </div>
  );
}
