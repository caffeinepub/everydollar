import { useGetPublicPortfolio } from '../hooks/useQueries';
import { useLiveQuotes, AssetMetadata } from '../hooks/useMarketData';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import AllocationDonutChart from '../components/charts/AllocationDonutChart';
import PerformanceLineChart from '../components/charts/PerformanceLineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { calculatePortfolioMetrics } from '../lib/portfolioMath';
import { Lock } from 'lucide-react';

interface PublicPortfolioPageProps {
  owner: string;
  portfolioName: string;
}

export default function PublicPortfolioPage({ owner, portfolioName }: PublicPortfolioPageProps) {
  const { data: portfolio, isLoading, isError, error } = useGetPublicPortfolio(owner, portfolioName);

  const assets: AssetMetadata[] = portfolio?.holdings.map(h => ({
    ticker: h.ticker,
    assetType: h.assetType,
  })) || [];

  const { data: quotes = [] } = useLiveQuotes(assets, assets.length > 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !portfolio) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-16">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Portfolio Not Available</h1>
          <p className="text-muted-foreground">
            {error?.message || 'This portfolio is private or does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const metrics = calculatePortfolioMetrics(portfolio, quotes);
  const primaryHolding = portfolio.holdings[0];

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>Public Portfolio</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{portfolio.name}</h1>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">
            ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-lg ${metrics.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {metrics.dailyChange >= 0 ? '+' : ''}${metrics.dailyChange.toFixed(2)} ({metrics.dailyChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <HoldingsTable
            portfolio={portfolio}
            quotes={quotes}
            readOnly={true}
          />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonutChart portfolio={portfolio} quotes={quotes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceLineChart
              portfolioName={portfolio.name}
              primaryAsset={primaryHolding ? {
                ticker: primaryHolding.ticker,
                assetType: primaryHolding.assetType,
              } : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
