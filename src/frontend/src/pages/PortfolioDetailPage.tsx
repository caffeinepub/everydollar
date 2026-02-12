import { useState, useEffect } from 'react';
import { useGetPortfolios } from '../hooks/useQueries';
import { useLiveQuotes, AssetMetadata } from '../hooks/useMarketData';
import { usePortfolioSimulation } from '../hooks/usePortfolioSimulation';
import { computeSimulatedQuotes } from '../lib/simulationQuotes';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import AllocationDonutChart from '../components/charts/AllocationDonutChart';
import PerformanceLineChart from '../components/charts/PerformanceLineChart';
import AddEditHoldingModal from '../components/portfolio/AddEditHoldingModal';
import RemoveHoldingConfirm from '../components/portfolio/RemoveHoldingConfirm';
import PortfolioSharingPanel from '../components/portfolio/PortfolioSharingPanel';
import DeletePortfolioDialog from '../components/portfolio/DeletePortfolioDialog';
import LastUpdatedIndicator from '../components/market/LastUpdatedIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FlaskConical, RotateCcw } from 'lucide-react';
import { calculatePortfolioMetrics } from '../lib/portfolioMath';

interface PortfolioDetailPageProps {
  portfolioName: string;
}

export default function PortfolioDetailPage({ portfolioName }: PortfolioDetailPageProps) {
  const { data: portfolios = [], isLoading, dataUpdatedAt } = useGetPortfolios();
  const portfolio = portfolios.find(p => p.name === portfolioName);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');

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
  }, [portfolioName, clearSimulation]);

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
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Portfolio not found</h1>
        <p className="text-muted-foreground">The portfolio "{portfolioName}" does not exist.</p>
      </div>
    );
  }

  const metrics = calculatePortfolioMetrics(portfolio, effectiveQuotes);
  const primaryHolding = portfolio.holdings[0];

  const handleEdit = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowAddModal(true);
  };

  const handleRemove = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowRemoveConfirm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{portfolio.name}</h1>
            {simulationEnabled && (
              <span className="px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-md">
                SIMULATION MODE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-lg ${metrics.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.dailyChange >= 0 ? '+' : ''}${metrics.dailyChange.toFixed(2)} ({metrics.dailyChangePercent.toFixed(2)}%)
            </div>
          </div>
          {!simulationEnabled && <LastUpdatedIndicator timestamp={dataUpdatedAt} />}
        </div>
        <div className="flex gap-2">
          <Button
            variant={simulationEnabled ? 'default' : 'outline'}
            onClick={toggleSimulation}
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            {simulationEnabled ? 'Exit Simulation' : 'Simulate'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holding
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Portfolio
          </Button>
        </div>
      </div>

      {/* Simulation Controls */}
      {simulationEnabled && (
        <Card className="border-accent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Simulation Controls</CardTitle>
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
              <div className="flex items-end gap-4">
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
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <HoldingsTable
            portfolio={portfolio}
            quotes={effectiveQuotes}
            onEdit={handleEdit}
            onRemove={handleRemove}
            simulationEnabled={simulationEnabled}
            priceOverrides={priceOverrides}
            onSetOverridePrice={setOverridePrice}
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
            <AllocationDonutChart portfolio={portfolio} quotes={effectiveQuotes} />
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

      {/* Settings */}
      <Tabs defaultValue="sharing">
        <TabsList>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>
        <TabsContent value="sharing">
          <PortfolioSharingPanel
            portfolioName={portfolio.name}
            isPublic={portfolio.isPublic}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddEditHoldingModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        portfolioName={portfolio.name}
      />
      <RemoveHoldingConfirm
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        portfolioName={portfolio.name}
        ticker={selectedTicker}
      />
      <DeletePortfolioDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        portfolioName={portfolio.name}
      />
    </div>
  );
}
