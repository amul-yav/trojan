import emailjs from '@emailjs/browser';
import { AlertRecord, EmailConfig } from '../types';

export class EmailService {
  private static lastPublicKey = '';

  static async send(alert: AlertRecord, config: EmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
      if (config.publicKey !== this.lastPublicKey) {
        emailjs.init(config.publicKey);
        this.lastPublicKey = config.publicKey;
      }

      const templateParams = {
        to_name: config.recipientName,
        to_email: config.recipientEmail,
        subject: this.buildSubject(alert),
        alert_type: alert.triggerType,
        city: alert.city,
        pollutant: alert.pollutant || 'Multiple',
        value: alert.value?.toFixed(1) || 'N/A',
        message: alert.message,
        severity_badge: this.getSeverityBadge(alert),
        triggered_at: new Date(alert.triggeredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        dashboard_url: window.location.href,
        recommendations: this.getRecommendations(alert),
      };

      const response = await emailjs.send(config.serviceId, config.templateId, templateParams);

      if (response.status === 200) {
        return { success: true };
      } else {
        return { success: false, error: `EmailJS returned status ${response.status}` };
      }
    } catch (error: any) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  private static buildSubject(alert: AlertRecord): string {
    switch (alert.triggerType) {
      case 'aqi_spike': return `⚠️ AQI Alert: Dangerous levels detected in ${alert.city}`;
      case 'compliance_violation': return `🚨 Compliance Violation: ${alert.city} exceeds WHO/EPA standards`;
      case 'ozone_breach': return `⚠️ Ozone Alert: O₃ breach detected in ${alert.city}`;
      case 'no2_breach': return `⚠️ NO₂ Alert: Nitrogen Dioxide spike in ${alert.city}`;
      case 'so2_breach': return `🏭 SO₂ Alert: Industrial emission event in ${alert.city}`;
      case 'pm25_breach': return `😷 PM2.5 Alert: Fine particle breach in ${alert.city}`;
      case 'sensor_fault_cluster': return `🔧 Sensor Warning: Multiple faults detected in ${alert.city}`;
      case 'forecast_crisis': return `📈 Crisis Forecast: Dangerous AQI predicted for ${alert.city}`;
      default: return `🔔 EcoSentinel Alert: ${alert.city}`;
    }
  }

  private static getRecommendations(alert: AlertRecord): string {
    switch (alert.triggerType) {
      case 'compliance_violation':
        return "1. Issue GRAP Stage advisory\n2. Activate emergency response\n3. Public health notification";
      case 'ozone_breach':
        return "1. Advise against outdoor activity 11am–5pm\n2. Alert sensitive groups\n3. Monitor photochemical conditions";
      case 'no2_breach':
        return "1. Implement odd-even vehicle restrictions\n2. Ban heavy vehicles from city core\n3. Check industrial stack emissions";
      case 'so2_breach':
        return "1. Inspect industrial units within 20km\n2. Issue stack emission compliance notice\n3. Deploy mobile monitoring units";
      case 'pm25_breach':
        return "1. Issue construction halt advisory\n2. Deploy anti-smog guns\n3. Advise N95 mask use";
      case 'forecast_crisis':
        return "1. Pre-position emergency response\n2. Issue 48h advance public advisory\n3. Coordinate with CPCB";
      default:
        return "1. Monitor situation\n2. Review sensor data\n3. Consider issuing public advisory";
    }
  }

  private static getSeverityBadge(alert: AlertRecord): string {
    switch (alert.triggerType) {
      case 'compliance_violation':
      case 'forecast_crisis':
        return 'CRITICAL';
      case 'so2_breach':
      case 'no2_breach':
        return 'HIGH';
      case 'ozone_breach':
      case 'pm25_breach':
        return 'MEDIUM';
      case 'sensor_fault_cluster':
        return 'WARNING';
      default:
        return 'ALERT';
    }
  }
}
