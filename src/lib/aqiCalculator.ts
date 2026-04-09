/**
 * Indian National Air Quality Index (NAQI) Calculator
 * Based on CPCB guidelines
 */

interface Breakpoint {
  low: number;
  high: number;
  iLow: number;
  iHigh: number;
}

const BREAKPOINTS: Record<string, Breakpoint[]> = {
  pm25: [
    { low: 0, high: 30, iLow: 0, iHigh: 50 },
    { low: 31, high: 60, iLow: 51, iHigh: 100 },
    { low: 61, high: 90, iLow: 101, iHigh: 200 },
    { low: 91, high: 120, iLow: 201, iHigh: 300 },
    { low: 121, high: 250, iLow: 301, iHigh: 400 },
    { low: 251, high: 500, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { low: 0, high: 50, iLow: 0, iHigh: 50 },
    { low: 51, high: 100, iLow: 51, iHigh: 100 },
    { low: 101, high: 250, iLow: 101, iHigh: 200 },
    { low: 251, high: 350, iLow: 201, iHigh: 300 },
    { low: 351, high: 430, iLow: 301, iHigh: 400 },
    { low: 431, high: 500, iLow: 401, iHigh: 500 },
  ],
  no2: [
    { low: 0, high: 40, iLow: 0, iHigh: 50 },
    { low: 41, high: 80, iLow: 51, iHigh: 100 },
    { low: 81, high: 180, iLow: 101, iHigh: 200 },
    { low: 181, high: 280, iLow: 201, iHigh: 300 },
    { low: 281, high: 400, iLow: 301, iHigh: 400 },
    { low: 401, high: 500, iLow: 401, iHigh: 500 },
  ],
  o3: [
    { low: 0, high: 50, iLow: 0, iHigh: 50 },
    { low: 51, high: 100, iLow: 51, iHigh: 100 },
    { low: 101, high: 168, iLow: 101, iHigh: 200 },
    { low: 169, high: 208, iLow: 201, iHigh: 300 },
    { low: 209, high: 748, iLow: 301, iHigh: 400 },
    { low: 749, high: 1000, iLow: 401, iHigh: 500 },
  ],
  so2: [
    { low: 0, high: 40, iLow: 0, iHigh: 50 },
    { low: 41, high: 80, iLow: 51, iHigh: 100 },
    { low: 81, high: 380, iLow: 101, iHigh: 200 },
    { low: 381, high: 800, iLow: 201, iHigh: 300 },
    { low: 801, high: 1600, iLow: 301, iHigh: 400 },
    { low: 1601, high: 2000, iLow: 401, iHigh: 500 },
  ],
  co: [
    { low: 0, high: 1, iLow: 0, iHigh: 50 },
    { low: 1.1, high: 2, iLow: 51, iHigh: 100 },
    { low: 2.1, high: 10, iLow: 101, iHigh: 200 },
    { low: 10.1, high: 17, iLow: 201, iHigh: 300 },
    { low: 17.1, high: 34, iLow: 301, iHigh: 400 },
    { low: 34.1, high: 50, iLow: 401, iHigh: 500 },
  ]
};

function calculateSubIndex(concentration: number, pollutant: string): number {
  const bps = BREAKPOINTS[pollutant.toLowerCase()];
  if (!bps) return 0;

  const bp = bps.find(b => concentration >= b.low && concentration <= b.high);
  if (!bp) {
    // If concentration exceeds highest breakpoint, return max index
    if (concentration > bps[bps.length - 1].high) return 500;
    return 0;
  }

  const { low, high, iLow, iHigh } = bp;
  return ((iHigh - iLow) / (high - low)) * (concentration - low) + iLow;
}

export function calculateNAQI(pollutants: Record<string, number>): number {
  const indices = Object.entries(pollutants).map(([name, value]) => {
    return calculateSubIndex(value, name);
  });

  // NAQI is the maximum of sub-indices
  // Requirement: At least 3 pollutants must be present, one of which must be PM10 or PM2.5
  const validIndices = indices.filter(i => i > 0);
  if (validIndices.length === 0) return 0;

  return Math.round(Math.max(...validIndices));
}

export function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}
