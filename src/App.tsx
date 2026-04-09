import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { runOrchestrator } from './agents/orchestrator';
import { PipelineResults, UserContext, CITIES, AgentEvent } from './types';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import CityAnalysis from './components/CityAnalysis';
import FireTracker from './components/FireTracker';
import Reports from './components/Reports';
import RoleSelector from './components/RoleSelector';
import EDAExplorer from './components/EDAExplorer';
import AgentActivity from './components/AgentActivity';
import ComplianceLog from './components/ComplianceLog';
import PolicyActions from './components/PolicyActions';
import AlertSettings from './components/AlertSettings';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AlertEngine } from './services/alertEngine';
import { EmailService } from './services/emailService';
import { AlertThresholds, AlertRule, AlertRecord, EmailConfig } from './types';
import { useRef } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedCityForAnalysis, setSelectedCityForAnalysis] = useState<string | null>(null);
  const [pipelineResults, setPipelineResults] = useState<PipelineResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('');
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(5); // Default 5 minutes

  // Alert State
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(() => {
    const saved = localStorage.getItem('ecosentinel_email_config');
    return saved ? JSON.parse(saved) : {
      serviceId: "",
      templateId: "",
      publicKey: "",
      recipientEmail: "",
      recipientName: ""
    };
  });

  const [alertThresholds, setAlertThresholds] = useState<AlertThresholds>(() => {
    const saved = localStorage.getItem('ecosentinel_alert_thresholds');
    return saved ? JSON.parse(saved) : {
      aqiSpike: 200,
      rateOfChangePercent: 30,
      ozone: 100,
      no2: 25,
      so2: 40,
      pm25: 15,
      urgencyScoreMin: 50,
      forecastCrisisAQI: 300
    };
  });

  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => {
    const saved = localStorage.getItem('ecosentinel_alert_rules');
    return saved ? JSON.parse(saved) : [
      { id: 'aqi_spike', triggerType: 'aqi_spike', enabled: true },
      { id: 'compliance_violation', triggerType: 'compliance_violation', enabled: true },
      { id: 'ozone_breach', triggerType: 'ozone_breach', enabled: true },
      { id: 'no2_breach', triggerType: 'no2_breach', enabled: true },
      { id: 'so2_breach', triggerType: 'so2_breach', enabled: true },
      { id: 'pm25_breach', triggerType: 'pm25_breach', enabled: true },
      { id: 'sensor_fault_cluster', triggerType: 'sensor_fault_cluster', enabled: true, onlyRealEvents: false },
      { id: 'forecast_crisis', triggerType: 'forecast_crisis', enabled: true }
    ];
  });

  const [alertHistory, setAlertHistory] = useState<AlertRecord[]>(() => {
    const saved = localStorage.getItem('ecosentinel_alert_history');
    return saved ? JSON.parse(saved) : [];
  });

  const sentAlertIds = useRef<Set<string>>(new Set());

  const runAlertEngine = useCallback(async (results: PipelineResults) => {
    if (!emailConfig) return;

    const enabledRules = alertRules.filter(r => r.enabled);
    const newAlerts = AlertEngine.evaluate(results, alertThresholds, enabledRules, sentAlertIds.current);

    if (newAlerts.length === 0) return;

    const sentAlerts = await Promise.all(
      newAlerts.map(async (alert) => {
        sentAlertIds.current.add(alert.id);
        const result = await EmailService.send(alert, emailConfig);
        return { ...alert, emailSent: result.success, emailError: result.error };
      })
    );

    setAlertHistory(prev => {
      const updated = [...sentAlerts, ...prev].slice(0, 100);
      localStorage.setItem('ecosentinel_alert_history', JSON.stringify(updated));
      return updated;
    });
  }, [emailConfig, alertRules, alertThresholds]);

  const executePipeline = useCallback(async () => {
    setLoading(true);
    setAgentEvents([]);
    try {
      setLoadingStage('🚀 Initializing EcoSentinel Multi-Agent Orchestrator...');
      
      const results = await runOrchestrator(userContext, (event) => {
        setAgentEvents(prev => [...prev, event]);
        setLoadingStage(`🤖 ${event.agentName} Agent: ${event.message}`);
      });
      setPipelineResults(results);
      await runAlertEngine(results);
    } catch (error) {
      console.error("Pipeline failed", error);
    } finally {
      setLoading(false);
    }
  }, [userContext, runAlertEngine]);

  useEffect(() => {
    executePipeline();
  }, []); // run on mount only

  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      console.log(`Auto-refreshing data (Interval: ${refreshInterval}m)`);
      executePipeline();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, userContext, executePipeline]);

  useEffect(() => {
    if (emailConfig) localStorage.setItem('ecosentinel_email_config', JSON.stringify(emailConfig));
  }, [emailConfig]);

  useEffect(() => {
    localStorage.setItem('ecosentinel_alert_thresholds', JSON.stringify(alertThresholds));
  }, [alertThresholds]);

  useEffect(() => {
    localStorage.setItem('ecosentinel_alert_rules', JSON.stringify(alertRules));
  }, [alertRules]);

  const handleTestAlert = async () => {
    if (!emailConfig) return;
    const testAlert: AlertRecord = {
      id: `test-${Date.now()}`,
      triggeredAt: new Date().toISOString(),
      triggerType: 'aqi_spike',
      city: 'Test City',
      message: 'This is a test alert from EcoSentinel to verify your EmailJS configuration.',
      pollutant: 'Test',
      value: 999,
      emailSent: false
    };
    const result = await EmailService.send(testAlert, emailConfig);
    setAlertHistory(prev => {
      const updated = [{ ...testAlert, emailSent: result.success, emailError: result.error }, ...prev].slice(0, 100);
      localStorage.setItem('ecosentinel_alert_history', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredResults = useMemo(() => {
    if (!pipelineResults || !userContext) return pipelineResults;

    const { jurisdiction } = userContext;
    
    // Filter cities based on jurisdiction
    const allowedCities = CITIES.filter(city => {
      if (jurisdiction.type === 'National') return true;
      if (jurisdiction.type === 'State') return city.state === jurisdiction.name;
      if (jurisdiction.type === 'District') return city.district === jurisdiction.name;
      if (jurisdiction.type === 'City') return city.name === jurisdiction.name;
      return false;
    }).map(c => c.name);

    const risks = pipelineResults.risks.filter(r => allowedCities.includes(r.city));
    
    // Fallback: if filtering results in 0 cities but we have data, show all data
    const finalRisks = (risks.length === 0 && pipelineResults.risks.length > 0) ? pipelineResults.risks : risks;

    return {
      ...pipelineResults,
      risks: finalRisks,
      forecasts: pipelineResults.forecasts.filter(f => allowedCities.includes(f.city) || finalRisks.some(r => r.city === f.city)),
      findings: {
        ...pipelineResults.findings,
        cityRankings: pipelineResults.findings.cityRankings.filter(r => allowedCities.includes(r.city) || finalRisks.some(risk => risk.city === r.city)),
        anomalies: pipelineResults.findings.anomalies.filter(a => allowedCities.includes(a.city) || finalRisks.some(risk => risk.city === a.city))
      },
      fireHotspots: pipelineResults.fireHotspots.filter(f => {
        if (jurisdiction.type === 'National') return true;
        if (jurisdiction.type === 'State') return f.state === jurisdiction.name;
        // For District/City, we filter by proximity to the allowed cities
        return CITIES.some(city => 
          allowedCities.includes(city.name) && 
          Math.abs(f.latitude - city.lat) < 1 && 
          Math.abs(f.longitude - city.lon) < 1
        );
      })
    };
  }, [pipelineResults, userContext]);

  const renderContent = () => {
    if (loading && !pipelineResults) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-50 rounded-full" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-black text-slate-900 tracking-tight">{loadingStage}</p>
            <p className="text-sm text-slate-400 font-medium">EcoSentinel AI is processing environmental data...</p>
          </div>
        </div>
      );
    }

    if (!filteredResults) return null;

    switch (activeTab) {
      case 'Overview': return (
        <Overview 
          results={filteredResults} 
          userContext={userContext}
          onCityClick={(cityName: string) => {
            setSelectedCityForAnalysis(cityName);
            setActiveTab('City Analysis');
          }}
        />
      );
      case 'City Analysis': return (
        <CityAnalysis 
          results={filteredResults} 
          userContext={userContext} 
          initialCity={selectedCityForAnalysis}
        />
      );
      case 'EDA Explorer': return <EDAExplorer results={filteredResults} />;
      case 'Agent Activity': return <AgentActivity results={filteredResults} />;
      case 'Compliance Log': return <ComplianceLog results={filteredResults} />;
      case 'Policy Actions': return <PolicyActions results={filteredResults} />;
      case 'Fire Tracker': return <FireTracker results={filteredResults} userContext={userContext} />;
      case 'Reports': return <Reports results={filteredResults} userContext={userContext} />;
      case 'Alert Settings': return (
        <AlertSettings 
          emailConfig={emailConfig}
          onSaveConfig={setEmailConfig}
          thresholds={alertThresholds}
          onSaveThresholds={setAlertThresholds}
          rules={alertRules}
          onToggleRule={(id) => setAlertRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))}
          alertHistory={alertHistory}
          onClearHistory={() => {
            setAlertHistory([]);
            localStorage.removeItem('ecosentinel_alert_history');
          }}
          testAlert={handleTestAlert}
        />
      );
      default: return <Overview results={filteredResults} userContext={userContext} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {!userContext && <RoleSelector onSelect={setUserContext} />}
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onRefresh={executePipeline}
        lastRefreshed={pipelineResults?.lastRefreshed}
        status={pipelineResults?.status}
        userContext={userContext}
        onLogout={() => setUserContext(null)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        alertHistory={alertHistory}
      />
      
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {renderContent()}
        </div>

        {/* Pipeline Log Expander */}
        <div className="fixed bottom-4 right-4 z-[1000]">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden min-w-[300px]">
            <details className="group">
              <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pipelineResults?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-semibold text-slate-700">⚙️ Pipeline Status</span>
                </div>
                <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/50">
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium text-slate-900">{pipelineResults?.lastRefreshed ? new Date(pipelineResults.lastRefreshed).toLocaleTimeString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Points:</span>
                  <span className="font-medium text-slate-900">{pipelineResults?.cleaningReport.rowsAfter}</span>
                </div>
                <div className="flex justify-between">
                  <span>Anomalies:</span>
                  <span className="font-medium text-slate-900">{pipelineResults?.cleaningReport.anomaliesDetected}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={10} /> Operational</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
