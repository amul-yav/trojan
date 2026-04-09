<div align="center">
<img src="https://img.shields.io/badge/EcoSentinel-AI-0f172a?style=for-the-badge&logo=leaf&logoColor=white" alt="EcoSentinel AI" height="40"/>
EcoSentinel AI
Autonomous Environmental Intelligence System for India
Real-time air quality monitoring · Multi-agent analytics pipeline · AI-powered policy advisories
Show Image
Show Image
Show Image
Show Image
Show Image
<br/>

"7 million people die from air pollution every year. Most were preventable — if the right people had the right information, 48 hours earlier. That's the gap EcoSentinel closes."

<br/>
Show Image
</div>

What is EcoSentinel AI?
EcoSentinel is a fully autonomous, end-to-end environmental analytics platform built for Indian government officials, NGOs, and public health authorities. It replaces the traditional manual analytics workflow — Excel files, delayed CPCB reports, generic dashboards — with a real-time multi-agent intelligence system that goes from raw sensor data to signed government advisory in under 30 seconds.
It monitors 276 Indian cities, tracks 6 critical pollutants, detects anomalies, forecasts 72 hours ahead, checks WHO/EPA compliance, and generates AI-written policy advisories — all autonomously, all in one platform.

Live Demo
🔗 https://astounding-begonia-80ab29.netlify.app/
Demo walkthrough (60 seconds):

Open the link → select Central Ministry role → click India
Watch the agent pipeline fire in the bottom-right status log
Open Agent Activity tab → switch to Timeline view — see all 9 agents and their execution times
Open Compliance Log → click Get Advisory on any city with violations
Open Alert Settings → configure your email → click Test Alert
Open EDA Explorer → click AI Data Summary for an AI-generated pattern analysis


Key Features
🤖 9-Agent Autonomous Pipeline
Every time the dashboard loads or auto-refreshes, 9 specialized agents coordinate to process environmental data end-to-end with zero manual intervention.
AgentResponsibilityFetcherPulls live AQI data from OpenAQ/WAQI and weather from Open-MeteoProcessorDeduplicates, forward-fills gaps, standardises timestampsMergerAligns AQI and weather datasets by city and nearest timestampAnalyzerComputes 30-day timeframe statistics and linear regression trendsAnomalyDetects spikes via z-score (>2.5σ), rate-of-change (>50%), and flatline (sensor fault)ForecasterGenerates 72-hour EWMA forecast with confidence bands per cityComplianceChecks every city against WHO and EPA thresholds simultaneouslySeasonalAnalyzes intra-day pollution cycles and seasonal patternsInsightsGenerates cross-domain weather-pollution correlations (Pearson r)
🗺️ Interactive Live Map

AQI colour-coded markers for every monitored city (Good → Severe)
Animated wind direction arrows showing real-time pollutant dispersion
Pollution dispersion radius scaled by wind speed and AQI severity
Click any city marker → instantly navigate to its detailed City Analysis
Red/green zone classification for public-facing risk communication

📊 Full EDA Explorer

Peak pollution hour detection across 24-hour cycles
Humidity vs PM2.5 scatter correlation plot
Pearson correlation heatmap across all pollutant pairs
City volatility scores (coefficient of variation)
One-click AI-generated data summary via Gemini

⚠️ Smart Anomaly Detection
Uses three simultaneous methods — not just thresholds:

Z-score method: flags readings >2.5 standard deviations from city mean
Rate-of-change method: triggers when a pollutant rises >50% in one step
Flatline detection: identifies 5+ consecutive identical readings as sensor faults
Automatic classification: distinguishes real environmental events from sensor malfunctions using multi-pollutant co-occurrence analysis

📋 WHO/EPA Compliance Engine

Compares all 6 pollutants against both WHO annual guidelines and EPA 24h standards simultaneously
Generates per-city alertUrgencyScore (0–100), populationAtRisk, persistenceScore, and recoveryTimeHours
One-click AI-written compliance advisory tailored to the user's role and jurisdiction
CSV export of the full compliance table

📧 Autonomous Email Alerts
8 configurable alert triggers with zero manual monitoring required:
TriggerFires Whenaqi_spikeAny city AQI exceeds thresholdcompliance_violationWHO/EPA violation with urgency score above minimumozone_breachO₃ exceeds WHO limitno2_breachNO₂ spike detected (vehicular/industrial)so2_breachSO₂ spike (industrial emission event)pm25_breachFine particulate matter breachsensor_fault_cluster3+ sensors in a city reporting faults simultaneouslyforecast_crisis72h forecast predicts AQI >300

Powered by EmailJS (200 emails/month free, no backend needed)
Role-specific subject lines, severity badges, and recommended actions per alert type
All thresholds user-configurable in real time
Full alert history with delivery status persisted in localStorage

👥 Role-Based Access
Four distinct roles, each seeing filtered data and contextual advisories for their jurisdiction:
RoleJurisdictionFocusMunicipal OfficerCityLocal enforcement, ward-level hotspotsDistrict CollectorDistrictAgricultural burning, inter-city driftState Environment BoardStateIndustrial compliance, cross-city trendsCentral MinistryNationalNCAP targets, inter-state pollution movement
📄 AI-Generated Reports

Generate Report button produces a structured 6-section environmental analysis report
Sections: Current Conditions → Trend Analysis → Compliance → AI Briefing → Health Advisory → Anomalies
Colour-coded metric cards, status badges, compliance tables, forecast tables
Powered by Google Gemini 2.0 Flash for intelligent narrative sections
Download as .txt for offline use and archival


Tech Stack
Frontend          React 19 · TypeScript · Vite 6 · Tailwind CSS 4
Maps              Leaflet · React-Leaflet 5
Charts            Recharts 3
AI/LLM            Google Gemini 2.0 Flash (@google/genai)
Email             EmailJS (@emailjs/browser)
Animations        Motion (Framer Motion)
Data Utils        Lodash · Date-fns
Icons             Lucide React
Deployment        Netlify

Architecture
src/
├── agents/                    # 9 autonomous pipeline agents
│   ├── orchestrator.ts        # Coordinates all agents, streams progress events
│   ├── dataFetcher.ts         # OpenAQ / WAQI / Open-Meteo API clients
│   ├── dataProcessor.ts       # Cleaning, dedup, forward-fill, outlier detection
│   ├── mergeService.ts        # Temporal alignment of AQI + weather datasets
│   ├── timeframeService.ts    # 30-day trend analysis, linear regression slope
│   ├── anomalyService.ts      # Z-score + rate-of-change + flatline detection
│   ├── forecastService.ts     # EWMA 72h forecast with confidence bands
│   ├── complianceService.ts   # WHO/EPA threshold comparison engine
│   ├── seasonalService.ts     # Intra-day and monthly seasonal patterns
│   ├── insightService.ts      # Pearson weather-pollution correlations
│   └── reportAgent.ts         # Gemini AI report and advisory generation
│
├── components/                # 12 dashboard tabs and UI panels
│   ├── Overview.tsx           # Live map + wind arrows + city risk grid
│   ├── CityAnalysis.tsx       # Per-city deep dive + 72h forecast chart
│   ├── EDAExplorer.tsx        # 4-panel exploratory data analysis
│   ├── AgentActivity.tsx      # Live agent log + execution timeline
│   ├── ComplianceLog.tsx      # WHO/EPA violation table + AI advisories
│   ├── PolicyActions.tsx      # Rule-based intervention suggestions
│   ├── AnomalyLog.tsx         # Anomaly feed with real/fault classification
│   ├── FireTracker.tsx        # Stubble burning hotspot map
│   ├── Reports.tsx            # AI-generated downloadable report
│   ├── AlertSettings.tsx      # Email alert configuration and history
│   └── RoleSelector.tsx       # Jurisdiction-aware login screen
│
├── services/
│   ├── alertEngine.ts         # 8-trigger alert evaluation engine
│   ├── emailService.ts        # EmailJS delivery with role-specific templates
│   └── gemini.ts              # Gemini API wrappers for all AI functions
│
└── lib/
    └── aqiCalculator.ts       # Official CPCB NAQI breakpoint calculator

Getting Started
Prerequisites

Node.js 18+
A free Google Gemini API key (for AI advisories)
Optional: EmailJS account (for email alerts, 200/month free)
Optional: WAQI token (for real-time AQI data)

Installation
bash# Clone the repository
git clone https://github.com/yourusername/ecosentinel-ai.git
cd ecosentinel-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
Environment Variables
Edit .env with your API keys:
env# Required for AI report generation and advisories
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: for real-time AQI data (falls back to synthetic if not set)
VITE_WAQI_TOKEN=your_waqi_token_here
VITE_OPENAQ_API_KEY=your_openaq_api_key_here

Note: The app runs in demo mode with synthetic data if no API keys are set. All features work — the AI report generation just uses pre-generated templates.

Run Locally
bashnpm run dev
# Opens at http://localhost:3000
Build for Production
bashnpm run build
npm run preview

Email Alerts Setup

Create a free account at emailjs.com
Add an Email Service (Gmail, Outlook, etc.) → copy the Service ID
Create an Email Template with these variables:

   {{to_name}}  {{to_email}}     {{subject}}
   {{city}}     {{pollutant}}    {{value}}
   {{message}}  {{severity_badge}} {{triggered_at}}
   {{recommendations}}  {{dashboard_url}}

Copy your Template ID and Public Key
In the app: Alert Settings tab → enter credentials → Save & Test


Data Sources
SourceDataAPIWAQIReal-time AQI, PM2.5, PM10, NO₂, O₃, SO₂, COFree with tokenOpenAQAir quality measurementsFree, optional keyOpen-MeteoTemperature, humidity, wind speed/directionFree, no key neededSyntheticFallback 7-day hourly data for all 276 citiesBuilt-in

Compliance Standards
EcoSentinel checks against two global standards simultaneously:
PollutantWHO GuidelineEPA 24h StandardPM2.515 µg/m³35 µg/m³PM1045 µg/m³150 µg/m³NO₂25 µg/m³100 µg/m³O₃100 µg/m³70 µg/m³SO₂40 µg/m³75 µg/m³CO4 mg/m³9 mg/m³

Screenshots
Overview MapAgent ActivityCompliance LogLive AQI map with wind arrowsReal-time agent execution logWHO/EPA violation tracker
EDA ExplorerCity AnalysisAlert SettingsCorrelation charts & volatility72h forecast with confidence bandEmail alert configuration

Roadmap

 Cross-city pollution corridor detection (downwind chain analysis)
 Dark mode
 City comparison view (side-by-side analysis)
 Shareable deep-link URLs per city alert
 Population-weighted risk scoring
 Push notifications (Web Push API)
 Historical data export (date range picker)


Contributing
Contributions are welcome. Please open an issue first to discuss what you'd like to change.
bash# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
# Open a Pull Request

License
MIT License — see LICENSE for details.

<div align="center">
Built with ❤️ for cleaner air and better governance
🌐 Live Demo · Report a Bug · Request Feature
<br/>
Generated by EcoSentinel AI · Autonomous Environmental Intelligence System
</div>
