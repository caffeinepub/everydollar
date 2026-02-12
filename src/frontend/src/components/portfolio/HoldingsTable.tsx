import type { Portfolio } from '../../backend';
import type { QuoteData } from '../../hooks/useMarketData';
import { calculateHoldingMetrics } from '../../lib/portfolioMath';
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
import { Pencil, Trash2, X } from 'lucide-react';
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
      <div className="text-center py-12 text-muted-foreground">
        No holdings yet. Add your first investment to get started!
      </div>
    );
  }

  const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
  const totalValue = portfolio.holdings.reduce((sum, h) => {
    const quote = quoteMap.get(h.ticker);
    const price = quote?.price || h.currentPrice.price;
    return sum + (h.shares * price);
  }, 0);

  const holdingsWithMetrics = portfolio.holdings.map(h =>
    calculateHoldingMetrics(h, quoteMap.get(h.ticker), totalValue)
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Avg Cost</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Market Value</TableHead>
            <TableHead className="text-right">Day Change</TableHead>
            <TableHead className="text-right">Total Return</TableHead>
            <TableHead className="text-right">% of Portfolio</TableHead>
            {!readOnly && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdingsWithMetrics.map((holding) => {
            const hasOverride = priceOverrides.has(holding.ticker);
            
            return (
              <TableRow key={holding.ticker}>
                <TableCell className="font-medium">{holding.ticker}</TableCell>
                <TableCell className="text-right">{holding.shares.toFixed(4)}</TableCell>
                <TableCell className="text-right">${holding.avgCost.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {simulationEnabled ? (
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={hasOverride ? priceOverrides.get(holding.ticker) : ''}
                        onChange={(e) => handleOverridePriceChange(holding.ticker, e.target.value)}
                        placeholder={`$${holding.currentPrice.price.toFixed(2)}`}
                        className="w-24 h-8 text-right"
                      />
                      {hasOverride && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => clearOverride(holding.ticker)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    `$${holding.currentPrice.price.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${holding.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className={`text-right ${holding.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {holding.dayChange >= 0 ? '+' : ''}${holding.dayChange.toFixed(2)}
                  <br />
                  <span className="text-xs">
                    ({holding.dayChangePercent >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%)
                  </span>
                </TableCell>
                <TableCell className={`text-right ${holding.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {holding.totalReturn >= 0 ? '+' : ''}${holding.totalReturn.toFixed(2)}
                  <br />
                  <span className="text-xs">
                    ({holding.totalReturnPercent >= 0 ? '+' : ''}{holding.totalReturnPercent.toFixed(2)}%)
                  </span>
                </TableCell>
                <TableCell className="text-right">{holding.allocationPercent.toFixed(2)}%</TableCell>
                {!readOnly && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(holding.ticker)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove?.(holding.ticker)}
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
  );
}
