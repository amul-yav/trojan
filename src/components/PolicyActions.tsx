import React from 'react';
import { PipelineResults, ComplianceReport } from '../types';
import { 
  Gavel, AlertCircle, ShieldCheck, Construction, Car, Factory, Wind, 
  Activity, ArrowRight, Info
} from 'lucide-react';
import _ from 'lodash';

interface PolicyActionsProps {
  results: PipelineResults;
}

export default function PolicyActions({ results }: PolicyActionsProps) {
  const reports = results.complianceReports;
  const citiesInNeed = reports.filter(r => r.status !== 'safe');
  
  const nationalSummary = {
    immediate: reports.filter(r => r.status === 'violation').length,
    monitor: reports.filter(r => r.status === 'caution').length,
    safe: reports.filter(r => r.status === 'safe').length
  };

  const getInterventions = (report: ComplianceReport) => {
    const actions: { icon: any, text: string, priority: 'Immediate' | 'This Week' | 'Monitor', impact: string }[] = [];
    const pollutants = report.violations.map(v => v.pollutant);
    const urgency = report.alertUrgencyScore;

    if (pollutants.includes('pm25') || pollutants.includes('pm10')) {
      actions.push({ 
        icon: Construction, 
        text: "Construction halt advisory", 
        priority: urgency > 60 ? 'Immediate' : 'This Week',
        impact: "Reduces surface-level dust by up to 40% in residential zones."
      });
      actions.push({ 
        icon: Wind, 
        text: "Anti-smog gun deployment", 
        priority: 'This Week',
        impact: "Localized suppression of heavy particulates in high-traffic corridors."
      });
    }

    if (pollutants.includes('no2')) {
      actions.push({ 
        icon: Car, 
        text: "Odd-even vehicle restriction", 
        priority: urgency > 70 ? 'Immediate' : 'This Week',
        impact: "Expected 25% reduction in vehicular NO2 emissions during peak hours."
      });
      actions.push({ 
        icon: AlertCircle, 
        text: "Heavy vehicle entry ban", 
        priority: 'Immediate',
        impact: "Prevents diesel exhaust accumulation in the city core."
      });
    }

    if (pollutants.includes('so2')) {
      actions.push({ 
        icon: Factory, 
        text: "Industrial unit inspection", 
        priority: 'Immediate',
        impact: "Ensures compliance with stack emission standards for local power/manufacturing."
      });
    }

    if (pollutants.includes('o3')) {
      actions.push({ 
        icon: Activity, 
        text: "Outdoor activity advisory", 
        priority: 'Monitor',
        impact: "Reduces public exposure to ground-level ozone during peak UV hours."
      });
    }

    if (urgency > 70) {
      actions.push({ 
        icon: Gavel, 
        text: "Activate GRAP Stage III", 
        priority: 'Immediate',
        impact: "Mandatory enforcement of emergency protocols across all sectors."
      });
    }

    return _.uniqBy(actions, 'text');
  };

  return (
    <div className="space-y-8">
      {/* National Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-900 p-2.5 rounded-xl">
            <Gavel className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Policy Intervention Framework</h2>
            <p className="text-sm text-slate-500">Rule-based suggestions for administrative action</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryStrip label="Immediate Action" count={nationalSummary.immediate} color="bg-red-500" />
          <SummaryStrip label="Active Monitoring" count={nationalSummary.monitor} color="bg-orange-500" />
          <SummaryStrip label="Safe / Compliant" count={nationalSummary.safe} color="bg-green-500" />
        </div>
      </div>

      {/* City Policy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {citiesInNeed.map(report => {
          const interventions = getInterventions(report);
          const cityRisk = results.risks.find(r => r.city === report.city);

          return (
            <div key={report.city} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900">{report.city}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    cityRisk?.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                    cityRisk?.severity === 'High' ? 'bg-orange-100 text-orange-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {cityRisk?.severity || 'Moderate'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${report.alertUrgencyScore > 70 ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ width: `${report.alertUrgencyScore}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 space-y-6">
                {interventions.map((action, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      action.priority === 'Immediate' ? 'bg-red-50 text-red-600' : 
                      action.priority === 'This Week' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <action.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-900">{action.text}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          action.priority === 'Immediate' ? 'bg-red-100 text-red-600' : 
                          action.priority === 'This Week' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">{action.impact}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">
                        View Protocol <ArrowRight size={10} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                <Info size={14} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Estimated recovery time: <span className="text-slate-900">{report.recoveryTimeHours.toFixed(1)} hours</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStrip({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-8 rounded-full ${color}`} />
        <span className="text-xs font-bold text-slate-600">{label}</span>
      </div>
      <span className="text-xl font-black text-slate-900">{count}</span>
    </div>
  );
}
