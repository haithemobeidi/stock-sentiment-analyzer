/**
 * Stock classification utilities
 */

export type StockClass = 'nano' | 'micro' | 'small' | 'mid' | 'large' | 'mega';

/**
 * Classify stock by market cap
 *
 * Classifications:
 * - Nano cap: < $50M (very risky, often penny stocks)
 * - Micro cap: $50M - $300M (penny stocks, high volatility)
 * - Small cap: $300M - $2B (emerging companies)
 * - Mid cap: $2B - $10B (established companies)
 * - Large cap: $10B - $200B (major companies)
 * - Mega cap: > $200B (giants like AAPL, MSFT)
 */
export function classifyByMarketCap(marketCap?: number): StockClass {
  if (!marketCap) return 'small'; // Default if unknown

  const billion = 1_000_000_000;
  const million = 1_000_000;

  if (marketCap < 50 * million) return 'nano';
  if (marketCap < 300 * million) return 'micro';
  if (marketCap < 2 * billion) return 'small';
  if (marketCap < 10 * billion) return 'mid';
  if (marketCap < 200 * billion) return 'large';
  return 'mega';
}

/**
 * Check if stock qualifies as a "penny stock"
 * Penny stocks typically have:
 * - Low share price (< $5)
 * - Small market cap (< $300M)
 */
export function isPennyStock(price: number, marketCap?: number): boolean {
  // Price under $5 AND small market cap
  if (price < 5 && marketCap && marketCap < 300_000_000) {
    return true;
  }

  // Nano/Micro cap stocks are typically considered penny stocks regardless of price
  const classification = classifyByMarketCap(marketCap);
  return classification === 'nano' || classification === 'micro';
}

/**
 * Format market cap for display
 */
export function formatMarketCap(marketCap?: number): string {
  if (!marketCap) return 'Unknown';

  const billion = 1_000_000_000;
  const million = 1_000_000;

  if (marketCap >= billion) {
    return `$${(marketCap / billion).toFixed(2)}B`;
  }

  if (marketCap >= million) {
    return `$${(marketCap / million).toFixed(2)}M`;
  }

  return `$${(marketCap / 1000).toFixed(2)}K`;
}

/**
 * Get risk level description
 */
export function getRiskLevel(classification: StockClass): string {
  const riskMap: Record<StockClass, string> = {
    nano: 'Very High Risk - Nano Cap',
    micro: 'High Risk - Micro Cap (Penny Stock)',
    small: 'Moderate-High Risk - Small Cap',
    mid: 'Moderate Risk - Mid Cap',
    large: 'Low-Moderate Risk - Large Cap',
    mega: 'Low Risk - Mega Cap',
  };

  return riskMap[classification];
}

/**
 * Get investment suitability for low capital traders
 */
export function getSuitabilityForLowCapital(
  price: number,
  marketCap?: number,
  volume?: number
): {
  suitable: boolean;
  reason: string;
  capitalNeeded: string;
} {
  const classification = classifyByMarketCap(marketCap);

  // Ideal for low capital: $1-$10 price, decent volume, small/micro cap
  if (price >= 1 && price <= 10 && (classification === 'micro' || classification === 'small')) {
    if (volume && volume > 100_000) {
      return {
        suitable: true,
        reason: 'Good liquidity, affordable entry, suitable for small accounts',
        capitalNeeded: `~$${(price * 100).toFixed(0)} for 100 shares`,
      };
    }
  }

  // Too expensive
  if (price > 100) {
    return {
      suitable: false,
      reason: 'Share price too high for low capital accounts',
      capitalNeeded: `~$${(price * 100).toFixed(0)} for 100 shares`,
    };
  }

  // Too risky (nano cap)
  if (classification === 'nano') {
    return {
      suitable: false,
      reason: 'Extremely high risk - nano cap, potential pump & dump',
      capitalNeeded: `~$${(price * 100).toFixed(0)} for 100 shares`,
    };
  }

  // Low volume
  if (volume && volume < 50_000) {
    return {
      suitable: false,
      reason: 'Low volume - may be difficult to enter/exit positions',
      capitalNeeded: `~$${(price * 100).toFixed(0)} for 100 shares`,
    };
  }

  // Default - maybe suitable
  return {
    suitable: true,
    reason: 'Potentially suitable - verify liquidity before trading',
    capitalNeeded: `~$${(price * 100).toFixed(0)} for 100 shares`,
  };
}
