import React, { useState } from 'react';
import { 
  Mail, 
  Bell, 
  Settings2, 
  History, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  ShieldCheck,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { EmailConfig, AlertThresholds, AlertRule, AlertRecord, AlertTriggerType } from '../types';
import { motion } from 'motion/react';

interface AlertSettingsProps {
  emailConfig: EmailConfig | null;
  onSaveConfig: (config: EmailConfig) => void;
  thresholds: AlertThresholds;
  onSaveThresholds: (t: AlertThresholds) => void;
  rules: AlertRule[];
  onToggleRule: (id: string) => void;
  alertHistory: AlertRecord[];
  onClearHistory: () => void;
  testAlert: () => void;
}

export default function AlertSettings({
  emailConfig,
  onSaveConfig,
  thresholds,
  onSaveThresholds,
  rules,
  onToggleRule,
  alertHistory,
  onClearHistory,
  testAlert
}: AlertSettingsProps) {
  const [localConfig, setLocalConfig] = useState<EmailConfig>(emailConfig || {
    serviceId: "",
    templateId: "",
    publicKey: "",
    recipientEmail: "",
    recipientName: ""
  });

  const [localThresholds, setLocalThresholds] = useState<AlertThresholds>(thresholds);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(localConfig);
  };

  const handleThresholdChange = (key: keyof AlertThresholds, value: number) => {
    const newThresholds = { ...localThresholds, [key]: value };
    setLocalThresholds(newThresholds);
    onSaveThresholds(newThresholds);
  };

  const resetThresholds = () => {
    const defaults: AlertThresholds = {
      aqiSpike: 200,
      rateOfChangePercent: 30,
      ozone: 100,
      no2: 25,
      so2: 40,
      pm25: 15,
      urgencyScoreMin: 50,
      forecastCrisisAQI: 300
    };
    setLocalThresholds(defaults);
    onSaveThresholds(defaults);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Alert Settings</h2>
          <p className="text-slate-500 font-medium">Configure autonomous notification triggers and email delivery.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: EmailJS Configuration */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Mail className="text-blue-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">EmailJS Configuration</h3>
            </div>
            {emailConfig ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck size={12} /> Configured
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                <Lock size={12} /> Not Set
              </div>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service ID</label>
                <input 
                  type="text" 
                  value={localConfig.serviceId}
                  onChange={e => setLocalConfig({...localConfig, serviceId: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="service_xxxx"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template ID</label>
                <input 
                  type="text" 
                  value={localConfig.templateId}
                  onChange={e => setLocalConfig({...localConfig, templateId: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="template_xxxx"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Key</label>
              <input 
                type="text" 
                value={localConfig.publicKey}
                onChange={e => setLocalConfig({...localConfig, publicKey: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="user_xxxx or public_xxxx"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Name</label>
                <input 
                  type="text" 
                  value={localConfig.recipientName}
                  onChange={e => setLocalConfig({...localConfig, recipientName: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Officer Name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Email</label>
                <input 
                  type="email" 
                  value={localConfig.recipientEmail}
                  onChange={e => setLocalConfig({...localConfig, recipientEmail: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="submit"
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                Save Configuration
              </button>
              <button 
                type="button"
                onClick={testAlert}
                disabled={!emailConfig}
                className="px-4 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Alert
              </button>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
              <Info className="text-blue-600 shrink-0" size={16} />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Get free credentials at <a href="https://emailjs.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">emailjs.com</a>. 
                The free tier includes 200 emails per month.
              </p>
            </div>
          </form>
        </section>

        {/* Section 2: Alert Thresholds */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl">
                <Settings2 className="text-orange-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Alert Thresholds</h3>
            </div>
            <button 
              onClick={resetThresholds}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Reset to WHO Defaults
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <ThresholdInput 
              label="AQI Spike" 
              unit="AQI ≥" 
              value={localThresholds.aqiSpike} 
              onChange={v => handleThresholdChange('aqiSpike', v)} 
            />
            <ThresholdInput 
              label="Rate of Change" 
              unit="Rise > %" 
              value={localThresholds.rateOfChangePercent} 
              onChange={v => handleThresholdChange('rateOfChangePercent', v)} 
            />
            <ThresholdInput 
              label="PM2.5 (WHO: 15)" 
              unit="µg/m³ ≥" 
              value={localThresholds.pm25} 
              onChange={v => handleThresholdChange('pm25', v)} 
            />
            <ThresholdInput 
              label="Ozone (WHO: 100)" 
              unit="µg/m³ ≥" 
              value={localThresholds.ozone} 
              onChange={v => handleThresholdChange('ozone', v)} 
            />
            <ThresholdInput 
              label="NO₂ (WHO: 25)" 
              unit="µg/m³ ≥" 
              value={localThresholds.no2} 
              onChange={v => handleThresholdChange('no2', v)} 
            />
            <ThresholdInput 
              label="SO₂ (WHO: 40)" 
              unit="µg/m³ ≥" 
              value={localThresholds.so2} 
              onChange={v => handleThresholdChange('so2', v)} 
            />
            <ThresholdInput 
              label="Min Urgency" 
              unit="Score ≥" 
              value={localThresholds.urgencyScoreMin} 
              onChange={v => handleThresholdChange('urgencyScoreMin', v)} 
            />
            <ThresholdInput 
              label="Forecast Crisis" 
              unit="AQI ≥" 
              value={localThresholds.forecastCrisisAQI} 
              onChange={v => handleThresholdChange('forecastCrisisAQI', v)} 
            />
          </div>
        </section>

        {/* Section 3: Alert Rules */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Bell className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Active Alert Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map(rule => (
              <div 
                key={rule.id}
                className={`p-4 rounded-2xl border transition-all ${rule.enabled ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-60'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    {rule.triggerType.replace(/_/g, ' ')}
                  </span>
                  <button 
                    onClick={() => onToggleRule(rule.id)}
                    className={`w-10 h-5 rounded-full transition-all relative ${rule.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rule.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {getRuleDescription(rule.triggerType)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Alert History */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-xl">
                <History className="text-slate-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Alert History</h3>
            </div>
            <button 
              onClick={onClearHistory}
              className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 size={12} /> Clear History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">City</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {alertHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-400 font-medium italic">
                      No alerts triggered yet.
                    </td>
                  </tr>
                ) : (
                  alertHistory.map(alert => (
                    <tr key={alert.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 text-xs text-slate-500 font-medium">
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-xs font-bold text-slate-900">
                        {alert.city}
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tight">
                          {alert.triggerType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {alert.emailSent ? (
                          <div className="flex items-center justify-center text-green-500" title="Email Sent Successfully">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center text-red-500" title={alert.emailError || "Failed to send email"}>
                            <XCircle size={16} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function ThresholdInput({ label, unit, value, onChange }: { label: string, unit: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full pl-4 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
          {unit}
        </span>
      </div>
    </div>
  );
}

function getRuleDescription(type: AlertTriggerType): string {
  switch (type) {
    case 'aqi_spike': return "Triggers when current AQI exceeds the set threshold in any city.";
    case 'compliance_violation': return "Triggers when a city violates WHO/EPA standards with high urgency.";
    case 'ozone_breach': return "Triggers when ground-level Ozone (O₃) exceeds WHO limits.";
    case 'no2_breach': return "Triggers on Nitrogen Dioxide spikes, usually from traffic or industry.";
    case 'so2_breach': return "Triggers on Sulfur Dioxide spikes, indicating industrial emission events.";
    case 'pm25_breach': return "Triggers when fine particulate matter (PM2.5) exceeds safe guidelines.";
    case 'sensor_fault_cluster': return "Triggers when 3+ sensors in a city report faults simultaneously.";
    case 'forecast_crisis': return "Triggers when the AI predicts a severe pollution crisis in the next 48h.";
    default: return "";
  }
}
