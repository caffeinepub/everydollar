import type { Portfolio, Holding } from '../backend';
import type { QuoteData } from '../hooks/useMarketData';

export interface HoldingWithMetrics extends Holding {
  marketValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  allocationPercent: number;
}

export function calculateHoldingMetrics(
  holding: Holding,
  quote: QuoteData | undefined,
  totalPortfolioValue: number
): HoldingWithMetrics {
  const currentPrice = quote?.price || holding.currentPrice.price;
  const marketValue = holding.shares * currentPrice;
  const costBasis = holding.shares * holding.avgCost;
  
  const dayChange = holding.shares * (quote?.change || holding.currentPrice.change);
  const dayChangePercent = quote?.changePercent || holding.currentPrice.changePercent;
  
  const totalReturn = marketValue - costBasis;
  const totalReturnPercent = costBasis > 0 ? (totalReturn / costBasis) * 100 : 0;
  
  const allocationPercent = totalPortfolioValue > 0 ? (marketValue / totalPortfolioValue) * 100 : 0;

  return {
    ...holding,
    currentPrice: {
      ...holding.currentPrice,
      price: currentPrice,
      change: quote?.change || holding.currentPrice.change,
      changePercent: quote?.changePercent || holding.currentPrice.changePercent,
    },
    marketValue,
    dayChange,
    dayChangePercent,
    totalReturn,
    totalReturnPercent,
    allocationPercent,
  };
}

export function calculatePortfolioMetrics(portfolio: Portfolio, quotes: QuoteData[]) {
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
  
  const holdings = portfolio.holdings.map(h => {
    const quote = quoteMap.get(h.ticker);
    const currentPrice = quote?.price || h.currentPrice.price;
    const marketValue = h.shares * currentPrice;
    return { 
      ...h, 
      marketValue, 
      currentPriceValue: currentPrice 
    };
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0);
  
  const dailyChange = holdings.reduce((sum, h) => {
    const quote = quoteMap.get(h.ticker);
    const change = quote?.change || h.currentPrice.change;
    return sum + (h.shares * change);
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
