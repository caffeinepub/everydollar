import { navigate } from '../../App';
import { useGetPortfolios } from '../../hooks/useQueries';
import { useLiveQuotes, AssetMetadata } from '../../hooks/useMarketData';
import { calculatePortfolioMetrics } from '../../lib/portfolioMath';
import { formatSignedUSD } from '../../utils/formatters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import CreatePortfolioDialog from '../portfolio/CreatePortfolioDialog';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { data: portfolios = [], isLoading } = useGetPortfolios();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Build unique asset metadata list from all holdings
  const allAssets: AssetMetadata[] = Array.from(
    new Map(
      portfolios.flatMap(p => 
        p.holdings.map(h => [
          h.ticker,
          {
            ticker: h.ticker,
            assetType: h.assetType,
          }
        ])
      )
    ).values()
  );

  const { data: quotes = [] } = useLiveQuotes(allAssets, portfolios.length > 0);

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-3 sm:p-4 border-b border-border">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Portfolio
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 sm:p-4 space-y-2">
            {portfolios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm px-2">
                No portfolios yet. Create one to get started!
              </div>
            ) : (
              portfolios.map((portfolio) => {
                const metrics = calculatePortfolioMetrics(portfolio, quotes);
                const isPositive = metrics.dailyChange >= 0;

                return (
                  <button
                    key={portfolio.name}
                    onClick={() => handleNavigate(`/portfolio/${encodeURIComponent(portfolio.name)}`)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                  >
                    <div className="font-medium text-sm mb-1 truncate">
                      {portfolio.name}
                    </div>
                    <div className="text-base sm:text-lg font-bold break-words">
                      ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs flex items-center gap-1 flex-wrap ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? <TrendingUp className="h-3 w-3 shrink-0" /> : <TrendingDown className="h-3 w-3 shrink-0" />}
                      <span className="break-all">{formatSignedUSD(metrics.dailyChange)} ({metrics.dailyChangePercent.toFixed(2)}%)</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      <CreatePortfolioDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  );
}
