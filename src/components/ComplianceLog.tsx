import React, { useState } from 'react';
import _ from 'lodash';
import { PipelineResults, ComplianceReport } from '../types';
import { 
  ShieldAlert, Users, Activity, AlertTriangle, ChevronDown, ChevronUp, Download,
  Search, Filter, ExternalLink, Loader2
} from 'lucide-react';
import { ReportAgent } from '../agents/reportAgent';

interface ComplianceLogProps {
  results: PipelineResults;
}

export default function ComplianceLog({ results }: ComplianceLogProps) {
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<string | null>(null);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);
  const [thresholdType, setThresholdType] = useState<'WHO' | 'NAAQS'>('WHO');

  const reports = results.complianceReports;
  const violationCount = reports.filter(r => r.status === 'violation').length;
  const highestUrgency = _.maxBy(reports, 'alertUrgencyScore');
  
  const allViolations = _.flatMap(reports, r => r.violations).filter(v => {
    if (thresholdType === 'WHO') return v.value > v.whoThreshold;
    return v.value > v.naaqsThreshold;
  });

  const mostViolatedPollutant = _(allViolations)
    .groupBy('pollutant')
    .map((group, pollutant) => ({ pollutant, count: group.length }))
    .maxBy('count')?.pollutant || 'N/A';

  const handleGetAdvisory = async (report: ComplianceReport) => {
    setLoadingAdvisory(true);
    setAdvisory(null);
    const text = await ReportAgent.generateComplianceAdvisory(report);
    setAdvisory(text);
    setLoadingAdvisory(false);
  };

  const downloadCSV = () => {
    const headers = ['City', 'Status', 'Urgency Score', 'Violations', 'Population at Risk', 'Recovery Time'];
    const rows = reports.map(r => [
      r.city,
      r.status,
      r.alertUrgencyScore.toFixed(1),
      r.violations.map(v => v.pollutant).join(';'),
      r.populationAtRisk,
      r.recoveryTimeHours.toFixed(1)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "compliance_report.csv");
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      {!import.meta.env.VITE_GEMINI_API_KEY && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>Running in demo mode — AI report generation uses pre-generated templates. 
          Add VITE_GEMINI_API_KEY to .env for live AI generation.</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Violations" value={allViolations.length} icon={ShieldAlert} color="red" />
        <SummaryCard title="Cities in Violation" value={violationCount} icon={AlertTriangle} color="orange" />
        <SummaryCard title="Highest Urgency" value={highestUrgency?.city || 'N/A'} subValue={`Score: ${highestUrgency?.alertUrgencyScore.toFixed(1)}`} icon={Activity} color="red" />
        <SummaryCard title="Most Violated" value={mostViolatedPollutant.toUpperCase()} icon={Users} color="blue" />
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-900">Regulatory Compliance Log</h3>
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setThresholdType('WHO')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${thresholdType === 'WHO' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                WHO
              </button>
              <button 
                onClick={() => setThresholdType('NAAQS')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${thresholdType === 'NAAQS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                NAAQS
              </button>
            </div>
          </div>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={14} />
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Violations</th>
                <th className="px-6 py-4">Urgency Score</th>
                <th className="px-6 py-4">Recovery Est.</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <React.Fragment key={report.city}>
                  <tr className={`hover:bg-slate-50/50 transition-colors ${expandedCity === report.city ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-900">{report.city}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        report.status === 'violation' ? 'bg-red-100 text-red-600' :
                        report.status === 'caution' ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {report.violations.map(v => (
                          <span key={v.pollutant} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">
                            {v.pollutant}
                          </span>
                        ))}
                        {report.violations.length === 0 && <span className="text-slate-300 text-[10px] font-bold">NONE</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${report.alertUrgencyScore > 70 ? 'bg-red-500' : report.alertUrgencyScore > 40 ? 'bg-orange-500' : 'bg-blue-500'}`}
                            style={{ width: `${report.alertUrgencyScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{report.alertUrgencyScore.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{report.recoveryTimeHours.toFixed(1)}h</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setExpandedCity(expandedCity === report.city ? null : report.city)}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"
                      >
                        {expandedCity === report.city ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>
                  {expandedCity === report.city && (
                    <tr>
                      <td colSpan={6} className="px-8 py-6 bg-blue-50/30 border-b border-slate-100">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detailed Violations ({thresholdType})</h4>
                            <div className="space-y-3">
                              {report.violations
                                .filter(v => thresholdType === 'WHO' ? v.value > v.whoThreshold : v.value > v.naaqsThreshold)
                                .map(v => (
                                <div key={v.pollutant} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-xs font-bold text-slate-900 uppercase">{v.pollutant}</span>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-red-600">{v.value.toFixed(1)} µg/m³</p>
                                    <div className="flex flex-col items-end">
                                      <p className="text-[9px] font-bold text-slate-400">Limit: {thresholdType === 'WHO' ? v.whoThreshold : v.naaqsThreshold}</p>
                                      <p className="text-[9px] font-black text-red-400">
                                        +{(((v.value - (thresholdType === 'WHO' ? v.whoThreshold : v.naaqsThreshold)) / (thresholdType === 'WHO' ? v.whoThreshold : v.naaqsThreshold)) * 100).toFixed(0)}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Compliance Advisory</h4>
                              <button 
                                onClick={() => handleGetAdvisory(report)}
                                disabled={loadingAdvisory}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline disabled:opacity-50"
                              >
                                {loadingAdvisory ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                                {advisory ? 'Regenerate' : 'Get Advisory'}
                              </button>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm min-h-[120px] flex items-center justify-center">
                              {advisory ? (
                                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">{advisory}</p>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Click 'Get Advisory' to generate AI insights</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subValue, icon: Icon, color }: any) {
  const colorMap: any = {
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
        {subValue && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
  );
}
