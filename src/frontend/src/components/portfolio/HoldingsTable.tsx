import { useState } from 'react';
import type { Portfolio } from '../../backend';
import type { QuoteData } from '../../hooks/useMarketData';
import { calculateHoldingMetrics } from '../../lib/portfolioMath';
import { formatSignedUSD } from '../../utils/formatters';
import { matchesQuery } from '../../utils/textSearch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, X, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HoldingsTableProps {
  portfolio: Portfolio;
  quotes: QuoteData[];
  isLoading?: boolean;
  readOnly?: boolean;
  onEdit?: (ticker: string) => void;
  onRemove?: (ticker: string) => void;
  simulationEnabled?: boolean;
  priceOverrides?: Map<string, number>;
  onSetOverridePrice?: (ticker: string, price: number | null) => void;
}

export default function HoldingsTable({
  portfolio,
  quotes,
  isLoading,
  readOnly = false,
  onEdit,
  onRemove,
  simulationEnabled = false,
  priceOverrides = new Map(),
  onSetOverridePrice,
}: HoldingsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (portfolio.holdings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground px-4">
        No holdings yet. Add your first investment to get started!
      </div>
    );
  }

  const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
  
  // Calculate total value only from holdings with live quotes
  const totalValue = portfolio.holdings.reduce((sum, h) => {
    const quote = quoteMap.get(h.ticker);
    if (!quote) return sum;
    return sum + (h.shares * quote.price);
  }, 0);

  const holdingsWithMetrics = portfolio.holdings.map(h =>
    calculateHoldingMetrics(h, quoteMap.get(h.ticker), totalValue)
  );

  // Filter holdings based on search query (case-insensitive)
  const filteredHoldings = holdingsWithMetrics.filter(holding =>
    matchesQuery(holding.ticker, searchQuery)
  );

  const handleOverridePriceChange = (ticker: string, value: string) => {
    if (!onSetOverridePrice) return;
    
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      onSetOverridePrice(ticker, null);
    } else {
      onSetOverridePrice(ticker, numValue);
    }
  };

  const clearOverride = (ticker: string) => {
    if (onSetOverridePrice) {
      onSetOverridePrice(ticker, null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="px-3 sm:px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search holdings by ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Holdings Table */}
      {filteredHoldings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground px-4">
          No holdings match "{searchQuery}"
        </div>
      ) : (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border-y sm:border sm:rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Ticker</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Shares</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Avg Cost</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Current Price</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Market Value</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Day Change</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Total Return</TableHead>
                    <TableHead className="text-right whitespace-nowrap">% of Portfolio</TableHead>
                    {!readOnly && <TableHead className="text-right whitespace-nowrap">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHoldings.map((holding) => {
                    const hasOverride = priceOverrides.has(holding.ticker);
                    
                    return (
                      <TableRow key={holding.ticker}>
                        <TableCell className="font-medium whitespace-nowrap">{holding.ticker}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{holding.shares.toFixed(4)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">${holding.avgCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {simulationEnabled ? (
                            <div className="flex items-center justify-end gap-1 min-w-[140px]">
                              <Input
                                type="number"
                                step="0.01"
                                value={hasOverride ? priceOverrides.get(holding.ticker) : ''}
                                onChange={(e) => handleOverridePriceChange(holding.ticker, e.target.value)}
                                placeholder={holding.hasMissingPrice ? '—' : `$${holding.currentPrice.price.toFixed(2)}`}
                                className="w-20 sm:w-24 h-8 text-right text-sm"
                              />
                              {hasOverride && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => clearOverride(holding.ticker)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="whitespace-nowrap">
                              {holding.hasMissingPrice ? '—' : `$${holding.currentPrice.price.toFixed(2)}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {holding.hasMissingPrice ? '—' : `$${holding.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </TableCell>
                        <TableCell className={`text-right whitespace-nowrap ${holding.hasMissingPrice ? 'text-muted-foreground' : holding.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {holding.hasMissingPrice ? '—' : (
                            <>
                              {formatSignedUSD(holding.dayChange)}
                              <br />
                              <span className="text-xs">
                                ({holding.dayChangePercent >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%)
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell className={`text-right whitespace-nowrap ${holding.hasMissingPrice ? 'text-muted-foreground' : holding.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {holding.hasMissingPrice ? '—' : (
                            <>
                              {formatSignedUSD(holding.totalReturn)}
                              <br />
                              <span className="text-xs">
                                ({holding.totalReturnPercent >= 0 ? '+' : ''}{holding.totalReturnPercent.toFixed(2)}%)
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {holding.hasMissingPrice ? '—' : `${holding.allocationPercent.toFixed(1)}%`}
                        </TableCell>
                        {!readOnly && (
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit?.(holding.ticker)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemove?.(holding.ticker)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
