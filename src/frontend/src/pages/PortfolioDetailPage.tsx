import { useState, useEffect } from 'react';
import { useGetPortfolios } from '../hooks/useQueries';
import { useLiveQuotes, AssetMetadata } from '../hooks/useMarketData';
import { usePortfolioSimulation } from '../hooks/usePortfolioSimulation';
import { computeSimulatedQuotes } from '../lib/simulationQuotes';
import { formatSignedUSD } from '../utils/formatters';
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
import type { Holding } from '../backend';

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
  const [editingHolding, setEditingHolding] = useState<Holding | undefined>(undefined);

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
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
        <Skeleton className="h-64 sm:h-96 w-full" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12 sm:py-16 px-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Portfolio not found</h1>
        <p className="text-muted-foreground">The portfolio "{portfolioName}" does not exist.</p>
      </div>
    );
  }

  const metrics = calculatePortfolioMetrics(portfolio, effectiveQuotes);
  const primaryHolding = portfolio.holdings[0];

  const handleEdit = (ticker: string) => {
    const holding = portfolio.holdings.find(h => h.ticker === ticker);
    setEditingHolding(holding);
    setShowAddModal(true);
  };

  const handleRemove = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowRemoveConfirm(true);
  };

  const handleAddNew = () => {
    setEditingHolding(undefined);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingHolding(undefined);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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
            {!simulationEnabled && <LastUpdatedIndicator timestamp={dataUpdatedAt} />}
          </div>
          
          {/* Action buttons - stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
            <Button
              variant={simulationEnabled ? 'default' : 'outline'}
              onClick={toggleSimulation}
              className="w-full sm:w-auto"
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              {simulationEnabled ? 'Exit Simulation' : 'Simulate'}
            </Button>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Holding
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Portfolio
            </Button>
          </div>
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
            onEdit={handleEdit}
            onRemove={handleRemove}
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

      {/* Settings */}
      <Tabs defaultValue="sharing" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="sharing" className="flex-1 sm:flex-none">Sharing</TabsTrigger>
        </TabsList>
        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Portfolio Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioSharingPanel portfolioName={portfolio.name} isPublic={portfolio.isPublic} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddEditHoldingModal
        open={showAddModal}
        onOpenChange={handleCloseAddModal}
        portfolioName={portfolio.name}
        existingHolding={editingHolding}
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
