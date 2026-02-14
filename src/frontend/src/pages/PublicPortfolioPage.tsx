import { useEffect } from 'react';
import { useGetPublicPortfolio } from '../hooks/useQueries';
import { useLiveQuotes, AssetMetadata } from '../hooks/useMarketData';
import { usePortfolioSimulation } from '../hooks/usePortfolioSimulation';
import { computeSimulatedQuotes } from '../lib/simulationQuotes';
import { formatSignedUSD } from '../utils/formatters';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import AllocationDonutChart from '../components/charts/AllocationDonutChart';
import PerformanceLineChart from '../components/charts/PerformanceLineChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { calculatePortfolioMetrics } from '../lib/portfolioMath';
import { Lock, FlaskConical, RotateCcw } from 'lucide-react';

interface PublicPortfolioPageProps {
  owner: string;
  portfolioName: string;
}

export default function PublicPortfolioPage({ owner, portfolioName }: PublicPortfolioPageProps) {
  const { data: portfolio, isLoading, isError, error } = useGetPublicPortfolio(owner, portfolioName);

  const {
    simulationEnabled,
    globalMovePercent,
    priceOverrides,
    toggleSimulation,
    setGlobalMovePercent,
    setOverridePrice,
    resetSimulation,
    clearSimulation,
  } = usePortfolioSimulation();

  // Clear simulation when portfolio changes
  useEffect(() => {
    clearSimulation();
  }, [owner, portfolioName, clearSimulation]);

  const assets: AssetMetadata[] = portfolio?.holdings.map(h => ({
    ticker: h.ticker,
    assetType: h.assetType,
  })) || [];

  const { data: liveQuotes = [] } = useLiveQuotes(assets, assets.length > 0);

  // Compute effective quotes (simulated or live)
  const effectiveQuotes = simulationEnabled && portfolio
    ? computeSimulatedQuotes(portfolio.holdings, liveQuotes, {
        globalMovePercent,
        priceOverrides,
      })
    : liveQuotes;

  if (isLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl space-y-4 sm:space-y-6">
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
        <Skeleton className="h-64 sm:h-96 w-full" />
      </div>
    );
  }

  if (isError || !portfolio) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
        <div className="text-center py-12 sm:py-16 px-4">
          <Lock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Portfolio Not Available</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {error?.message || 'This portfolio is private or does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const metrics = calculatePortfolioMetrics(portfolio, effectiveQuotes);
  const primaryHolding = portfolio.holdings[0];

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold break-words">{portfolio.name}</h1>
              {simulationEnabled && (
                <span className="px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-md whitespace-nowrap">
                  SIMULATION MODE
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-3xl sm:text-4xl font-bold break-words">
                ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-base sm:text-lg ${metrics.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatSignedUSD(metrics.dailyChange)} ({metrics.dailyChangePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
          <Button
            variant={simulationEnabled ? 'default' : 'outline'}
            onClick={toggleSimulation}
            className="w-full sm:w-auto"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            {simulationEnabled ? 'Exit Simulation' : 'Simulate'}
          </Button>
        </div>
      </div>

      {/* Simulation Controls */}
      {simulationEnabled && (
        <Card className="border-accent">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base sm:text-lg">Simulation Controls</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSimulation}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex-1">
                  <Label htmlFor="global-move">Global Market Move (%)</Label>
                  <Input
                    id="global-move"
                    type="number"
                    step="0.1"
                    value={globalMovePercent}
                    onChange={(e) => setGlobalMovePercent(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., -5 for -5%, +10 for +10%"
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Set individual prices below to override global move for specific holdings
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Holdings</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <HoldingsTable
            portfolio={portfolio}
            quotes={effectiveQuotes}
            readOnly={true}
            simulationEnabled={simulationEnabled}
            priceOverrides={priceOverrides}
            onSetOverridePrice={setOverridePrice}
          />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonutChart portfolio={portfolio} quotes={effectiveQuotes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Performance</CardTitle>
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
