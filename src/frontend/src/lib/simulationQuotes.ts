import type { Holding } from '../backend';
import type { QuoteData } from '../hooks/useMarketData';

export interface SimulationParams {
  globalMovePercent: number;
  priceOverrides: Map<string, number>;
}

/**
 * Compute simulated quotes from live quotes and simulation parameters.
 * Precedence: override > global move > live quote
 * Never falls back to holding.currentPrice
 */
export function computeSimulatedQuotes(
  holdings: Holding[],
  liveQuotes: QuoteData[],
  params: SimulationParams
): QuoteData[] {
  const { globalMovePercent, priceOverrides } = params;
  const quoteMap = new Map(liveQuotes.map(q => [q.symbol, q]));

  return holdings
    .map(holding => {
      const liveQuote = quoteMap.get(holding.ticker);
      
      // If no live quote exists, skip this holding (don't create simulated quote)
      if (!liveQuote) {
        return null;
      }

      const override = priceOverrides.get(holding.ticker);

      let simulatedPrice: number;
      let simulatedChange: number;
      let simulatedChangePercent: number;

      if (override !== undefined) {
        // Use override price
        simulatedPrice = override;
        simulatedChange = override - (liveQuote.price - liveQuote.change);
        simulatedChangePercent = liveQuote.price > 0 
          ? (simulatedChange / (liveQuote.price - liveQuote.change)) * 100 
          : 0;
      } else if (globalMovePercent !== 0) {
        // Apply global move to live price
        const moveMultiplier = 1 + globalMovePercent / 100;
        simulatedPrice = liveQuote.price * moveMultiplier;
        simulatedChange = liveQuote.change * moveMultiplier;
        simulatedChangePercent = liveQuote.changePercent;
      } else {
        // No simulation, return live quote as-is
        return liveQuote;
      }

      return {
        symbol: holding.ticker,
        price: simulatedPrice,
        change: simulatedChange,
        changePercent: simulatedChangePercent,
        currency: liveQuote.currency,
      };
    })
    .filter((q): q is QuoteData => q !== null);
}
