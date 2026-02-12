import { useState, useEffect } from 'react';
import { useAddHolding } from '../../hooks/useQueries';
import TickerTypeahead from '../market/TickerTypeahead';
import { SearchResult } from '../../hooks/useMarketData';
import type { Holding } from '../../backend';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddEditHoldingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioName: string;
  existingHolding?: Holding;
}

const CHART_COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function AddEditHoldingModal({
  open,
  onOpenChange,
  portfolioName,
  existingHolding,
}: AddEditHoldingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');

  const addMutation = useAddHolding();

  useEffect(() => {
    if (existingHolding) {
      setSelectedResult({
        symbol: existingHolding.ticker,
        name: existingHolding.ticker,
        type: existingHolding.assetType,
      });
      setShares(existingHolding.shares.toString());
      setAvgCost(existingHolding.avgCost.toString());
    } else {
      setSelectedResult(null);
      setShares('');
      setAvgCost('');
      setSearchQuery('');
    }
  }, [existingHolding, open]);

  const handleTickerSelect = (result: SearchResult) => {
    setSelectedResult(result);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResult || !shares || !avgCost) {
      toast.error('Please fill in all fields');
      return;
    }

    const sharesNum = parseFloat(shares);
    const avgCostNum = parseFloat(avgCost);

    if (isNaN(sharesNum) || sharesNum <= 0) {
      toast.error('Please enter a valid number of shares');
      return;
    }

    if (isNaN(avgCostNum) || avgCostNum <= 0) {
      toast.error('Please enter a valid cost basis');
      return;
    }

    const holding: Holding = {
      ticker: selectedResult.symbol,
      shares: sharesNum,
      avgCost: avgCostNum,
      assetType: selectedResult.type || 'Stock',
      color: CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)],
      currentPrice: {
        price: avgCostNum,
        change: 0,
        changePercent: 0,
        currency: 'USD',
      },
    };

    try {
      await addMutation.mutateAsync({ portfolioName, holding });
      toast.success(`${existingHolding ? 'Updated' : 'Added'} ${selectedResult.symbol} successfully`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${existingHolding ? 'update' : 'add'} holding`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{existingHolding ? 'Edit' : 'Add'} Holding</DialogTitle>
            <DialogDescription>
              {existingHolding ? 'Update the details of your holding.' : 'Search for a ticker and enter your position details.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {!existingHolding && (
              <div>
                <Label htmlFor="search">Search Ticker</Label>
                <div className="mt-2">
                  <TickerTypeahead
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSelect={handleTickerSelect}
                    placeholder="Search by symbol (e.g., AAPL, ICP, MINA)"
                  />
                </div>
              </div>
            )}

            {selectedResult && (
              <>
                <div className="p-3 bg-accent rounded-md">
                  <div className="font-medium">Selected: {selectedResult.symbol}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedResult.name} • {selectedResult.type}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shares">Shares / Units</Label>
                    <Input
                      id="shares"
                      type="number"
                      step="any"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="avgCost">Average Cost Basis</Label>
                    <Input
                      id="avgCost"
                      type="number"
                      step="any"
                      value={avgCost}
                      onChange={(e) => setAvgCost(e.target.value)}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending || !selectedResult}>
              {addMutation.isPending ? 'Saving...' : existingHolding ? 'Update' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
