import type { Portfolio, Holding } from '../backend';
import type { QuoteData } from '../hooks/useMarketData';

export interface HoldingWithMetrics extends Holding {
  marketValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  allocationPercent: number;
  hasMissingPrice: boolean;
}

export function calculateHoldingMetrics(
  holding: Holding,
  quote: QuoteData | undefined,
  totalPortfolioValue: number
): HoldingWithMetrics {
  // Never fall back to holding.currentPrice - only use live quotes
  const hasMissingPrice = !quote;
  const currentPrice = quote?.price || 0;
  const marketValue = quote ? holding.shares * currentPrice : 0;
  const costBasis = holding.shares * holding.avgCost;
  
  const dayChange = quote ? holding.shares * quote.change : 0;
  const dayChangePercent = quote?.changePercent || 0;
  
  const totalReturn = marketValue - costBasis;
  const totalReturnPercent = costBasis > 0 && quote ? (totalReturn / costBasis) * 100 : 0;
  
  const allocationPercent = totalPortfolioValue > 0 && quote ? (marketValue / totalPortfolioValue) * 100 : 0;

  return {
    ...holding,
    currentPrice: {
      ...holding.currentPrice,
      price: currentPrice,
      change: quote?.change || 0,
      changePercent: quote?.changePercent || 0,
    },
    marketValue,
    dayChange,
    dayChangePercent,
    totalReturn,
    totalReturnPercent,
    allocationPercent,
    hasMissingPrice,
  };
}

export function calculatePortfolioMetrics(portfolio: Portfolio, quotes: QuoteData[]) {
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
  
  const holdings = portfolio.holdings.map(h => {
    const quote = quoteMap.get(h.ticker);
    // Only use live quote, never fall back to holding.currentPrice
    const currentPrice = quote?.price || 0;
    const marketValue = quote ? h.shares * currentPrice : 0;
    return { 
      ...h, 
      marketValue, 
      currentPriceValue: currentPrice,
      hasQuote: !!quote,
    };
  });

  // Only sum holdings that have live quotes
  const totalValue = holdings
    .filter(h => h.hasQuote)
    .reduce((sum, h) => sum + h.marketValue, 0);
  
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0);
  
  const dailyChange = holdings.reduce((sum, h) => {
    const quote = quoteMap.get(h.ticker);
    // Only include change if we have a live quote
    if (!quote) return sum;
    return sum + (h.shares * quote.change);
  }, 0);
  
  const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;
  
  const totalReturn = totalValue - totalCostBasis;
  const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

  return {
    totalValue,
    dailyChange,
    dailyChangePercent,
    totalReturn,
    totalReturnPercent,
    holdingsCount: holdings.length,
  };
}
