import { GoogleGenAI } from "@google/genai";
import { AgentEvent, ComplianceReport, EDAReport } from '../types';
import _ from 'lodash';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export class ReportAgent {
  static async generateCrisisAlert(city: string, riskScore: number, peakAQI: number, topFactors: string[], onProgress?: (event: AgentEvent) => void) {
    const startTime = Date.now();
    onProgress?.({
      agentName: 'Report',
      status: 'running',
      message: `Generating crisis alert for ${city}...`,
      timestamp: new Date().toISOString()
    });

    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return `OFFICIAL ADVISORY: ${city}
    
The current environmental situation in ${city} is under close monitoring. With a risk score of ${riskScore}/100 and projected peak AQI of ${Math.round(peakAQI)}, the atmosphere is categorized as sensitive.

Over the next 7 days, we expect continued elevation in pollutant levels due to ${topFactors.join(', ')}. Meteorological conditions are likely to trap particulate matter near the surface.

The Ministry of Environment recommends: 1. Implementation of the Graded Response Action Plan (GRAP). 2. Mandatory suspension of non-essential construction activities. 3. Advisory for citizens to use N95 masks during peak morning hours.`;
    }

    try {
      const prompt = `
You are an environmental advisor to the Indian government.

City: ${city}
Risk Score: ${riskScore}/100
Forecasted Peak AQI (next 7 days): ${peakAQI}
Primary causes: ${topFactors.join(', ')}

Write a government advisory in exactly 3 short paragraphs:
Paragraph 1: Current situation (2 sentences)
Paragraph 2: What will happen next 7 days and why (2 sentences)  
Paragraph 3: Exactly 3 specific policy actions recommended

Tone: Official Indian government style. Specific, not vague.
Do not use bullet points. Plain paragraphs only.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      onProgress?.({
        agentName: 'Report',
        status: 'done',
        message: `Generated crisis alert for ${city}.`,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime
      });

      return response.text || "Advisory generation failed.";
    } catch (error) {
      console.error("Gemini API error:", error);
      return "Advisory currently unavailable due to technical issues.";
    }
  }

  static async generateMorningBriefing(risks: any[], role?: string, onProgress?: (event: AgentEvent) => void) {
    const startTime = Date.now();
    onProgress?.({
      agentName: 'Report',
      status: 'running',
      message: 'Generating consolidated morning briefing...',
      timestamp: new Date().toISOString()
    });

    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return `Consolidated Briefing for ${role || 'Policy Maker'}: All major cities in your jurisdiction are under surveillance. High risk factors detected in key urban centers. Immediate policy interventions are advised for high-risk zones.`;
    }

    try {
      const summary = risks.map(r => `${r.city}: Risk ${Math.round(r.riskScore)} (${r.severity})`).join(', ');
      const prompt = `
You are an AI Orchestrator managing three specialized agents for an environmental briefing:
1. **Research Agent**: Scans historical data and cross-domain correlations (weather, fires).
2. **Analysis Agent**: Performs short-horizon forecasting (24-72h) and identifies anomalies.
3. **Policy Agent**: Translates findings into actionable mandates for a ${role || 'Policy Maker'}.

Generate a consolidated briefing based on these city risk scores: ${summary}.

Structure your response to show the "Agent Collaboration":
- [Research Insight]: Mention a cross-domain correlation (e.g., wind speed vs PM2.5).
- [Analysis Forecast]: Mention the 24-72h outlook using TFT/Prophet terminology.
- [Policy Mandate]: Provide 3 specific actions tailored for a ${role || 'General Official'}.

Tone: Highly professional, urgent but controlled, official.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      onProgress?.({
        agentName: 'Report',
        status: 'done',
        message: 'Generated consolidated morning briefing.',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime
      });

      return response.text || "Briefing generation failed.";
    } catch (error) {
      console.error("Gemini API error:", error);
      return "Briefing currently unavailable.";
    }
  }

  static async generateComplianceAdvisory(report: ComplianceReport, onProgress?: (event: AgentEvent) => void): Promise<string> {
    const startTime = Date.now();
    onProgress?.({
      agentName: 'Report',
      status: 'running',
      message: `Generating compliance advisory for ${report.city}...`,
      timestamp: new Date().toISOString()
    });

    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return `Compliance Advisory for ${report.city}: Multiple pollutants exceed WHO/EPA standards. Immediate mitigation measures required.`;
    }

    try {
      const violationsStr = report.violations.map(v => `${v.pollutant} (${v.value} µg/m³, ${v.exceedancePercent.toFixed(1)}% above WHO)`).join(', ');
      const prompt = `
Given the city ${report.city}, with the following pollutant violations: ${violationsStr}.
Generate a 2-paragraph official advisory:
Paragraph 1: Current compliance situation and health risks.
Paragraph 2: Recommended immediate policy and public health actions.

Tone: Official, urgent, authoritative.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      onProgress?.({
        agentName: 'Report',
        status: 'done',
        message: `Generated compliance advisory for ${report.city}.`,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime
      });

      return response.text || "Compliance advisory generation failed.";
    } catch (error) {
      return "Compliance advisory currently unavailable.";
    }
  }

  static async generateEDASummary(edaReport: EDAReport, onProgress?: (event: AgentEvent) => void): Promise<string> {
    const startTime = Date.now();
    onProgress?.({
      agentName: 'Report',
      status: 'running',
      message: 'Generating EDA summary...',
      timestamp: new Date().toISOString()
    });

    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return "EDA Summary: Peak pollution observed in morning hours. Strong correlation between humidity and PM2.5 levels.";
    }

    try {
      const peakHour = _.maxBy(edaReport.peakPollutionHours, 'avgAQI')?.hour;
      const topVolatile = _.maxBy(edaReport.volatilityScores, 'score')?.city;
      const topCorr = _.maxBy(edaReport.pollutantCorrelations, c => Math.abs(c.correlation));

      const prompt = `
Given these EDA findings:
- Peak pollution hour: ${peakHour}:00
- Most volatile city: ${topVolatile}
- Strongest correlation: ${topCorr?.pair} (r=${topCorr?.correlation.toFixed(2)})

Generate a 3-sentence plain-language summary of the air quality patterns found in the data.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      onProgress?.({
        agentName: 'Report',
        status: 'done',
        message: 'Generated EDA summary.',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime
      });

      return response.text || "EDA summary generation failed.";
    } catch (error) {
      return "EDA summary currently unavailable.";
    }
  }
}
