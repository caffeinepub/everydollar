import type { QuoteData } from '../hooks/useMarketData';
import type { Holding } from '../backend';

export interface SimulationParams {
  globalMovePercent: number;
  priceOverrides: Map<string, number>;
}

/**
 * Compute simulated quote data from live quotes + simulation parameters.
 * Precedence: per-holding override > global percentage move > live price
 */
export function computeSimulatedQuotes(
  holdings: Holding[],
  liveQuotes: QuoteData[],
  simulation: SimulationParams
): QuoteData[] {
  const quoteMap = new Map(liveQuotes.map(q => [q.symbol, q]));

  return holdings.map(holding => {
    const liveQuote = quoteMap.get(holding.ticker);
    const livePrice = liveQuote?.price || holding.currentPrice.price;
    
    // Determine simulated price based on precedence
    let simulatedPrice: number;
    if (simulation.priceOverrides.has(holding.ticker)) {
      // Per-holding override takes precedence
      simulatedPrice = simulation.priceOverrides.get(holding.ticker)!;
    } else if (simulation.globalMovePercent !== 0) {
      // Apply global percentage move
      simulatedPrice = livePrice * (1 + simulation.globalMovePercent / 100);
    } else {
      // No simulation, use live price
      simulatedPrice = livePrice;
    }

    // Calculate simulated day change from simulated price vs implied previous close
    // Previous close = current price - change
    const livePreviousClose = livePrice - (liveQuote?.change || holding.currentPrice.change);
    const simulatedChange = simulatedPrice - livePreviousClose;
    const simulatedChangePercent = livePreviousClose > 0 
      ? (simulatedChange / livePreviousClose) * 100 
      : 0;

    return {
      symbol: holding.ticker,
      price: simulatedPrice,
      change: simulatedChange,
      changePercent: simulatedChangePercent,
      currency: liveQuote?.currency || holding.currentPrice.currency,
    };
  });
}
