# EcoSentinel AI 🌍

Autonomous environmental crisis prediction system for the Indian government.

Hosting: https://astounding-begonia-80ab29.netlify.app/

## Overview
EcoSentinel AI is a high-performance environmental monitoring and prediction dashboard. It automates the ingestion, cleaning, and analysis of air quality and weather data to provide real-time crisis intelligence.

## Key Features
- **Live Data Ingestion**: Pulls real-time measurements from OpenAQ and Open-Meteo APIs.
- **Automated Cleaning Pipeline**: Handles missing values, removes duplicates, and flags anomalies using statistical methods.
- **Predictive Modeling**: Forecasts AQI trends for the next 7 days using time-series analysis.
- **AI-Powered Advisories**: Generates official government advisories and morning briefings using Gemini AI.
- **Interactive Visualizations**: Real-time maps, gauges, and trend charts powered by Leaflet and Recharts.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Visualization**: Recharts, Leaflet, Framer Motion
- **AI**: Google Gemini API
- **Data Processing**: Lodash, Date-fns

## Setup Instructions
1. **API Key**: This app uses the Google Gemini API for generating advisories. Ensure `GEMINI_API_KEY` is set in your environment.
2. **Installation**:
   ```bash
   npm install
   ```
3. **Development**:
   ```bash
   npm run dev
   ```

## Data Sources
- **Air Quality**: [OpenAQ](https://openaq.org/) (Free API)
- **Weather**: [Open-Meteo](https://open-meteo.com/) (Free API)
- **Fire Data**: Synthetic realistic hotspots based on regional seasonal patterns.

## Pipeline Log
The application includes a real-time pipeline log (bottom-right corner) that tracks every stage of the data processing cycle, proving the automation to stakeholders and judges.

## Email Alerts Setup

1. Go to [emailjs.com](https://emailjs.com) and create a free account (200 emails/month).
2. Create an Email Service (Gmail, Outlook, etc.) → copy the **Service ID**.
3. Create an Email Template with these variables:
   - `{{to_name}}`, `{{to_email}}`, `{{subject}}`
   - `{{alert_type}}`, `{{city}}`, `{{pollutant}}`, `{{value}}`
   - `{{message}}`, `{{severity_badge}}`, `{{triggered_at}}`
   - `{{dashboard_url}}`, `{{recommendations}}`
4. Copy your **Template ID** and **Public Key**.
5. Open EcoSentinel → **Alert Settings** tab → enter your credentials → **Save & Test**.
6. You'll receive a test email confirming setup is complete.

### Suggested Template HTML for EmailJS:
**Subject:** `{{subject}}`
**Body:**
```html
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <h2 style="color: #0f172a; margin-top: 0;">EcoSentinel Environmental Alert</h2>
  <div style="display: inline-block; padding: 4px 12px; background: #fee2e2; color: #b91c1c; border-radius: 6px; font-weight: bold; font-size: 12px; margin-bottom: 16px;">
    {{severity_badge}}
  </div>
  
  <p style="color: #475569; font-size: 14px; line-height: 1.6;">
    <strong>Location:</strong> {{city}}<br>
    <strong>Pollutant:</strong> {{pollutant}}<br>
    <strong>Measured Value:</strong> {{value}}
  </p>
  
  <p style="color: #1e293b; font-weight: 500; border-left: 4px solid #3b82f6; padding-left: 12px; margin: 20px 0;">
    {{message}}
  </p>
  
  <p style="color: #64748b; font-size: 12px;">
    Triggered at: {{triggered_at}}
  </p>
  
  <h4 style="color: #0f172a; margin-bottom: 8px;">Recommended Actions:</h4>
  <pre style="background: #f8fafc; padding: 12px; border-radius: 8px; color: #334155; font-size: 13px; white-space: pre-wrap; font-family: inherit;">
{{recommendations}}
  </pre>
  
  <div style="margin-top: 24px; text-align: center;">
    <a href="{{dashboard_url}}" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
      View Live Dashboard
    </a>
  </div>
</div>
```
