import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function generateCrisisAlert(city: string, riskScore: number, peakAQI: number, topFactors: string[]) {
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

    return response.text || "Advisory generation failed.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Advisory currently unavailable due to technical issues.";
  }
}

export async function generateMorningBriefing(risks: any[], role?: string) {
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

    return response.text || "Briefing generation failed.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Briefing currently unavailable.";
  }
}

export async function generateFullReport(
  city: string,
  cityRisk: any,
  cityForecasts: any[],
  cityAnomalies: any[],
  cityCompliance: any,
  cityCorrelations: any[],
  peakHour: number,
  windData: { speed: number; direction: string },
  role: string
): Promise<string> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return `EXECUTIVE SUMMARY
${city} is currently classified as ${cityRisk.category} with an AQI of ${Math.round(cityRisk.currentAQI)}. The primary driver is elevated ${cityRisk.topFactors[0] || 'particulate matter'}. ${cityRisk.healthAdvice.general}

CURRENT CONDITIONS
AQI: ${Math.round(cityRisk.currentAQI)} | Category: ${cityRisk.category} | Risk Score: ${Math.round(cityRisk.riskScore)}/100
PM2.5: ${cityRisk.pollutants.pm25.toFixed(1)} µg/m³ | PM10: ${cityRisk.pollutants.pm10.toFixed(1)} µg/m³ | NO₂: ${cityRisk.pollutants.no2.toFixed(1)} µg/m³
O₃: ${cityRisk.pollutants.o3.toFixed(1)} µg/m³ | SO₂: ${cityRisk.pollutants.so2.toFixed(1)} µg/m³ | CO: ${cityRisk.pollutants.co.toFixed(2)} mg/m³
Wind Speed: ${windData.speed.toFixed(1)} m/s | Wind Direction: ${windData.direction}

TREND ANALYSIS
Peak pollution hour identified at ${peakHour}:00. ${cityRisk.topFactors.join(', ')} are the primary contributing factors. The 72-hour forecast indicates ${cityForecasts.some(f => f.crisis_predicted) ? 'a potential crisis scenario with AQI projected above 300' : 'moderate conditions with gradual improvement expected'}.

CORRELATION INSIGHTS
${cityCorrelations.slice(0, 2).map(c => `${c.factorA} vs ${c.factorB}: coefficient ${c.coefficient} (${c.significance} significance) — ${c.insight}`).join('\n')}

RISK ASSESSMENT
Severity: ${cityRisk.severity} | Compliance: ${cityCompliance?.status?.toUpperCase() || 'N/A'} | Population at Risk: ${cityCompliance?.populationAtRisk || 'N/A'} thousand
${cityAnomalies.length > 0 ? `${cityAnomalies.length} anomalies detected. Most recent: ${cityAnomalies[0]?.possibleCause || 'Unknown cause'}.` : 'No anomalies detected in current data window.'}
Estimated recovery time: ${cityCompliance?.recoveryTimeHours?.toFixed(0) || 'N/A'} hours

AI INTERPRETATION
Based on combined analysis of environmental and meteorological data, the most probable cause is ${cityRisk.topFactors.join(' combined with ')}. ${windData.speed < 2 ? 'Low wind speed is limiting pollutant dispersion.' : 'Wind conditions are moderately dispersing pollutants.'} Confidence Level: ${cityForecasts[0] ? Math.round(cityForecasts[0].forecastConfidence) + '%' : 'Medium'}

RECOMMENDATIONS
Immediate: ${cityRisk.healthAdvice.activities.join('. ')}
For sensitive groups: ${cityRisk.healthAdvice.sensitive}
Administrative: ${cityCompliance?.violations?.length > 0 ? 'Issue compliance notices for ' + cityCompliance.violations.map((v: any) => v.pollutant.toUpperCase()).join(', ') + ' violations.' : 'Maintain current monitoring protocols.'}`;
  }

  try {
    const prompt = `
You are EcoSentinel AI, an autonomous environmental intelligence system generating an official environmental analysis report.

REAL-TIME DATA FOR ${city}:
- AQI: ${Math.round(cityRisk.currentAQI)} (${cityRisk.category})
- Risk Score: ${Math.round(cityRisk.riskScore)}/100
- Severity: ${cityRisk.severity}
- PM2.5: ${cityRisk.pollutants.pm25.toFixed(1)} µg/m³
- PM10: ${cityRisk.pollutants.pm10.toFixed(1)} µg/m³  
- NO₂: ${cityRisk.pollutants.no2.toFixed(1)} µg/m³
- O₃: ${cityRisk.pollutants.o3.toFixed(1)} µg/m³
- SO₂: ${cityRisk.pollutants.so2.toFixed(1)} µg/m³
- CO: ${cityRisk.pollutants.co.toFixed(2)} mg/m³
- Wind Speed: ${windData.speed.toFixed(1)} m/s, Direction: ${windData.direction}
- Primary factors: ${cityRisk.topFactors.join(', ')}
- Peak pollution hour: ${peakHour}:00
- Compliance status: ${cityCompliance?.status || 'unknown'}
- Active violations: ${cityCompliance?.violations?.map((v: any) => v.pollutant).join(', ') || 'none'}
- Anomalies detected: ${cityAnomalies.length}
- 72h forecast: ${cityForecasts.map(f => Math.round(f.forecast_aqi)).join(', ')} AQI
- Correlations: ${cityCorrelations.slice(0, 2).map(c => `${c.factorA}/${c.factorB}: r=${c.coefficient}`).join('; ')}
- Report recipient: ${role}

Generate a structured environmental analysis report with EXACTLY these 8 numbered sections. Use the real data above throughout — do not invent numbers. Be specific and technical.

1. EXECUTIVE SUMMARY
2. CURRENT ENVIRONMENTAL CONDITIONS (mention all 6 pollutants, wind, humidity)
3. TREND ANALYSIS (mention peak hour, rate of change, 72h forecast outlook)
4. CORRELATION INSIGHTS (use the provided correlation data)
5. RISK ASSESSMENT (mention severity, population at risk, anomaly count)
6. AI-BASED INTERPRETATION (probable cause, confidence level based on forecastConfidence)
7. RECOMMENDATIONS (split into: Immediate Actions, Administrative Measures)
8. CONCLUSION

Tone: Official technical report. Specific values, not vague language. Use µg/m³ units. No markdown headers — use plain section numbers and names as shown above.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Report currently unavailable.";
  }
}
