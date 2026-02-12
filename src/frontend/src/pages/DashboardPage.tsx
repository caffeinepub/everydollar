import { useGetPortfolios } from '../hooks/useQueries';
import { useLiveQuotes, AssetMetadata } from '../hooks/useMarketData';
import PortfolioCard from '../components/portfolio/PortfolioCard';
import { Skeleton } from '@/components/ui/skeleton';
import LastUpdatedIndicator from '../components/market/LastUpdatedIndicator';

export default function DashboardPage() {
  const { data: portfolios = [], isLoading, dataUpdatedAt } = useGetPortfolios();

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Portfolios</h1>
        <LastUpdatedIndicator timestamp={dataUpdatedAt} />
      </div>

      {portfolios.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-4">
            You don't have any portfolios yet
          </p>
          <p className="text-sm text-muted-foreground">
            Create your first portfolio using the sidebar to start tracking your investments
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map(portfolio => (
            <PortfolioCard
              key={portfolio.name}
              portfolio={portfolio}
              quotes={quotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
