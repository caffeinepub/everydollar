import { navigate } from '../../App';
import { useGetPortfolios } from '../../hooks/useQueries';
import { useLiveQuotes } from '../../hooks/useMarketData';
import { calculatePortfolioMetrics } from '../../lib/portfolioMath';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import CreatePortfolioDialog from '../portfolio/CreatePortfolioDialog';

export default function Sidebar() {
  const { data: portfolios = [], isLoading } = useGetPortfolios();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const allTickers = Array.from(
    new Set(portfolios.flatMap(p => p.holdings.map(h => h.ticker)))
  );
  const { data: quotes = [] } = useLiveQuotes(allTickers, portfolios.length > 0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
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
        <div className="p-4 border-b border-border">
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
          <div className="p-4 space-y-2">
            {portfolios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No portfolios yet. Create one to get started!
              </div>
            ) : (
              portfolios.map((portfolio) => {
                const metrics = calculatePortfolioMetrics(portfolio, quotes);
                const isPositive = metrics.dailyChange >= 0;

                return (
                  <button
                    key={portfolio.name}
                    onClick={() => navigate(`/portfolio/${encodeURIComponent(portfolio.name)}`)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                  >
                    <div className="font-medium text-sm mb-1 truncate">
                      {portfolio.name}
                    </div>
                    <div className="text-lg font-bold">
                      ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? '+' : ''}{metrics.dailyChange.toFixed(2)} ({metrics.dailyChangePercent.toFixed(2)}%)
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
