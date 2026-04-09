import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { PipelineResults, CITIES, UserContext } from '../types';
import { 
  Activity, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Building2, 
  Map as MapIcon, 
  Landmark, 
  Shield,
  ChevronRight,
  Zap
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface OverviewProps {
  results: PipelineResults;
  userContext: UserContext | null;
  onCityClick?: (cityName: string) => void;
}

export default function Overview({ results, userContext, onCityClick }: OverviewProps) {
  const criticalCount = results.risks.filter(r => r.riskScore > 75).length;
  const highestRisk = results.risks.length > 0 
    ? results.risks.reduce((prev, current) => (prev.riskScore > current.riskScore) ? prev : current)
    : null;

  const sortedByAQI = [...results.risks].sort((a, b) => b.currentAQI - a.currentAQI);
  const topPolluted = sortedByAQI.slice(0, 4);
  const cleanest = sortedByAQI.slice(-4).reverse();

  const getAQIColor = (aqi: number) => {
    if (aqi > 400) return 'text-white bg-naqi-severe'; // Severe
    if (aqi > 300) return 'text-white bg-naqi-verypoor'; // Very Poor
    if (aqi > 200) return 'text-white bg-naqi-poor'; // Poor
    if (aqi > 100) return 'text-slate-900 bg-naqi-moderate'; // Moderate
    if (aqi > 50) return 'text-slate-900 bg-naqi-satisfactory'; // Satisfactory
    return 'text-white bg-naqi-good'; // Good
  };

  const getRoleSpecificAdvisory = () => {
    if (!userContext) return null;

    const { role, jurisdiction } = userContext;

    switch (role) {
      case 'Municipal Officer':
        return {
          title: `Municipal Action Plan: ${jurisdiction.name}`,
          description: `Localized enforcement strategies for ${jurisdiction.name} zones.`,
          actions: [
            "Immediate ban on construction dust in high-risk areas.",
            "Traffic rerouting for heavy vehicles during peak hours.",
            "Mandatory water sprinkling on major arterial roads.",
            "Inspection of local small-scale industrial units."
          ],
          icon: Building2,
          color: 'blue'
        };
      case 'District Collector':
        return {
          title: `District Crisis Management: ${jurisdiction.name}`,
          description: `Monitoring agricultural hotspots and rural-to-urban pollution drift.`,
          actions: [
            "Deployment of nodal officers to high-burning village clusters.",
            "Activation of stubble management machinery subsidies.",
            "Public health advisory for rural primary health centers.",
            "Coordination with neighboring districts for drift mitigation."
          ],
          icon: MapIcon,
          color: 'orange'
        };
      case 'State Environment Board':
        return {
          title: `State Compliance Oversight: ${jurisdiction.name}`,
          description: `Inter-city comparison and large-scale industrial violation tracking.`,
          actions: [
            "Issuance of show-cause notices to non-compliant industries.",
            "State-wide implementation of Graded Response Action Plan (GRAP).",
            "Budget allocation for additional monitoring stations in Tier-2 cities.",
            "Cross-departmental meeting for state-level transport policy."
          ],
          icon: Landmark,
          color: 'purple'
        };
      case 'Central Ministry':
        return {
          title: `National Strategic Briefing (MoEFCC)`,
          description: `Macro-level analysis of inter-state pollution movement and national targets.`,
          actions: [
            "Inter-state coordination for NCAP (National Clean Air Programme).",
            "Parliamentary briefing on seasonal pollution trends.",
            "National emergency fund activation for severe crisis zones.",
            "Strategic review of BS-VI implementation impact."
          ],
          icon: Shield,
          color: 'slate'
        };
      default:
        return null;
    }
  };

  const advisory = getRoleSpecificAdvisory();

  const windByCity = results.cleanData.reduce((acc: Record<string, {speed: number, dir: number}>, d: any) => {
    if (d.windSpeed !== undefined && d.windDirection !== undefined && !acc[d.city]) {
      acc[d.city] = { speed: d.windSpeed, dir: d.windDirection };
    }
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {userContext?.jurisdiction.name} <span className="text-slate-400">Environmental Overview</span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">Real-time intelligence for the {userContext?.role || 'Administrative'} level.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Live</span>
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Cities Monitored" 
          value={results.risks.length.toString()} 
          icon={Activity} 
          color="blue" 
        />
        <MetricCard 
          title="Critical Alerts" 
          value={criticalCount.toString()} 
          icon={AlertCircle} 
          color={criticalCount > 0 ? "red" : "green"} 
        />
        <MetricCard 
          title="Highest Risk" 
          value={highestRisk?.city || 'N/A'} 
          subValue={highestRisk ? `Score: ${Math.round(highestRisk.riskScore)}` : ''}
          icon={TrendingUp} 
          color="orange" 
        />
        <MetricCard 
          title="System Health" 
          value={results.status === 'healthy' ? "Optimal" : "Degraded"} 
          icon={ShieldCheck} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden h-[550px] shadow-sm relative">
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Live Air Quality Index</h3>
            <div className="flex flex-col gap-2 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-naqi-severe" /> Severe (400+)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-naqi-verypoor" /> Very Poor (301-400)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-naqi-poor" /> Poor (201-300)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-naqi-moderate" /> Moderate (101-200)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-naqi-satisfactory" /> Satisfactory (51-100)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-naqi-good" /> Good (0-50)</div>
              <div className="border-t border-slate-100 mt-2 pt-2 flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
                  <path d="M12 3 L12 18 M12 3 L7 9 M12 3 L17 9" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Wind direction</span>
              </div>
            </div>
          </div>

          <MapContainer center={[20.5937, 78.9629]} zoom={userContext?.jurisdiction.type === 'National' ? 5 : 7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {results.risks.map(cityRisk => {
              const cityCoords = CITIES.find(c => c.name === cityRisk.city);
              if (!cityCoords || cityCoords.lat === undefined || cityCoords.lon === undefined) return null;
              
              const color = cityRisk.currentAQI > 400 ? '#b91c1c' : 
                            cityRisk.currentAQI > 300 ? '#ef4444' : 
                            cityRisk.currentAQI > 200 ? '#f97316' : 
                            cityRisk.currentAQI > 100 ? '#eab308' : 
                            cityRisk.currentAQI > 50 ? '#84cc16' : '#22c55e';

              return (
                <CircleMarker 
                  key={cityRisk.city}
                  center={[cityCoords.lat, cityCoords.lon]}
                  radius={12}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 1 }}
                  eventHandlers={{
                    click: () => onCityClick?.(cityRisk.city)
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[140px]">
                      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">{cityRisk.city}</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-medium">AQI</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getAQIColor(cityRisk.currentAQI)}`}>
                          {Math.round(cityRisk.currentAQI)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2">{cityRisk.category}</p>
                      {onCityClick && (
                        <button
                          onClick={() => onCityClick(cityRisk.city)}
                          className="w-full text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg transition-colors text-center"
                        >
                          Open City Analysis →
                        </button>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {results.risks.map(cityRisk => {
              const cityCoords = CITIES.find(c => c.name === cityRisk.city);
              const wind = windByCity[cityRisk.city];
              if (!cityCoords || !wind || wind.speed < 0.5) return null;

              // Arrow opacity and size scale with wind speed (capped at speed 20)
              const opacity = Math.min(1, 0.3 + (wind.speed / 20) * 0.7);
              const arrowSize = Math.min(28, 16 + wind.speed);

              const arrowIcon = L.divIcon({
                className: '',
                html: `
                  <div style="
                    width: ${arrowSize}px;
                    height: ${arrowSize}px;
                    transform: rotate(${wind.dir}deg);
                    opacity: ${opacity};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.5s ease;
                  ">
                    <svg viewBox="0 0 24 24" width="${arrowSize}" height="${arrowSize}" fill="none">
                      <path d="M12 3 L12 18 M12 3 L7 9 M12 3 L17 9" 
                        stroke="#1e40af" 
                        stroke-width="2.5" 
                        stroke-linecap="round" 
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                `,
                iconSize: [arrowSize, arrowSize],
                iconAnchor: [arrowSize / 2, arrowSize / 2],
              });

              // Offset the arrow marker slightly NE of the circle so they don't overlap
              const offsetLat = cityCoords.lat + 0.4;
              const offsetLon = cityCoords.lon + 0.4;

              return (
                <Marker
                  key={`wind-${cityRisk.city}`}
                  position={[offsetLat, offsetLon]}
                  icon={arrowIcon}
                />
              );
            })}
          </MapContainer>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          {/* AI Policy Advisory */}
          {advisory && (
            <div className={`bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group`}>
              <div className={`absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`} />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                    <advisory.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight leading-tight">{advisory.title}</h3>
                </div>
                <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">
                  {advisory.description}
                </p>
                <div className="space-y-3 mb-8">
                  {advisory.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                      <p className="text-xs font-bold leading-snug text-white/90">{action}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full py-4 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all shadow-xl active:scale-95">
                  Execute Action Plan
                </button>
              </div>
            </div>
          )}

          {/* Cross-Domain Correlations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Cross-Domain Correlations</h3>
            <div className="space-y-4">
              {results.findings.correlations.map((corr, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
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
                      {corr.significance} Impact
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-bold mb-1">Coeff: {corr.coefficient}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">{corr.insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* City Risk Grid */}
      <div className="space-y-6">
        <div className="flex items-end justify-between px-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Regional Air Quality Insights</h3>
            <p className="text-sm text-slate-500">Real-time monitoring across your jurisdiction</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            {results.risks.length} Cities in View
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...results.risks].sort((a, b) => b.riskScore - a.riskScore).slice(0, 12).map(city => (
            <div 
              key={city.city} 
              onClick={() => onCityClick?.(city.city)}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{city.city}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-900">{Math.round(city.currentAQI)}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase">AQI</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  city.severity === 'Critical' ? 'bg-red-50 text-red-600' :
                  city.severity === 'High' ? 'bg-orange-50 text-orange-600' :
                  city.severity === 'Moderate' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-green-50 text-green-600'
                }`}>
                  {city.severity}
                </span>
              </div>
              
              <div className="h-14 w-full mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={city.forecastTrend.map((val, i) => ({ val, i }))}>
                    <Line 
                      type="monotone" 
                      dataKey="val" 
                      stroke={city.severity === 'Critical' ? '#ef4444' : '#3b82f6'} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Forecast Trend</span>
                <TrendingUp size={12} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subValue, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    red: "text-red-600 bg-red-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        {subValue && <span className="text-xs font-semibold text-slate-400">{subValue}</span>}
      </div>
    </div>
  );
}
