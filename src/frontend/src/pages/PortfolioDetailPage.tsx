import { useState } from 'react';
import { useGetPortfolios } from '../hooks/useQueries';
import { useLiveQuotes, AssetMetadata } from '../hooks/useMarketData';
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
import { Plus, Trash2 } from 'lucide-react';
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

  const assets: AssetMetadata[] = portfolio?.holdings.map(h => ({
    ticker: h.ticker,
    assetType: h.assetType,
  })) || [];

  const { data: quotes = [] } = useLiveQuotes(assets, assets.length > 0);

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

  const metrics = calculatePortfolioMetrics(portfolio, quotes);
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
          <h1 className="text-3xl font-bold mb-2">{portfolio.name}</h1>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-lg ${metrics.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.dailyChange >= 0 ? '+' : ''}${metrics.dailyChange.toFixed(2)} ({metrics.dailyChangePercent.toFixed(2)}%)
            </div>
          </div>
          <LastUpdatedIndicator timestamp={dataUpdatedAt} />
        </div>
        <div className="flex gap-2">
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

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <HoldingsTable
            portfolio={portfolio}
            quotes={quotes}
            onEdit={handleEdit}
            onRemove={handleRemove}
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
