import { useLiveQuotes, useHistoricalData, AssetMetadata } from '../hooks/useMarketData';
import { getCryptoId } from '../lib/symbols';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigate } from '../App';

interface TickerPreviewPageProps {
  symbol: string;
}

export default function TickerPreviewPage({ symbol }: TickerPreviewPageProps) {
  // Try to determine if this is a crypto asset
  const cryptoId = getCryptoId(symbol);
  const assetMetadata: AssetMetadata = {
    ticker: symbol,
    assetType: cryptoId ? 'Crypto' : 'Stock',
    cryptoId: cryptoId || undefined,
  };

  const { data: quotes = [], isLoading: quotesLoading } = useLiveQuotes([assetMetadata]);
  const { data: historicalData = [], isLoading: historyLoading } = useHistoricalData(assetMetadata, '1mo');

  const quote = quotes[0];

  const chartData = historicalData.map(point => ({
    timestamp: point.timestamp,
    value: point.value,
    date: format(new Date(point.timestamp), 'MMM d'),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{symbol}</h1>
        {cryptoId && (
          <span className="text-sm text-muted-foreground">Crypto</span>
        )}
      </div>

      {quotesLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : quote ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold">
                ${quote.price.toFixed(2)}
              </div>
              <div className={`text-lg ${quote.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No data available for {symbol}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>30-Day Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="oklch(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="oklch(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--popover))',
                    border: '1px solid oklch(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
