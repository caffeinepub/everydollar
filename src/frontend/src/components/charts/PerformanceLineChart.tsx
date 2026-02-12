import { useState } from 'react';
import { useHistoricalData, AssetMetadata } from '../../hooks/useMarketData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface PerformanceLineChartProps {
  portfolioName: string;
  primaryAsset?: AssetMetadata;
}

const RANGES = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '1Y', value: '1y' },
];

export default function PerformanceLineChart({ portfolioName, primaryAsset }: PerformanceLineChartProps) {
  const [range, setRange] = useState('1mo');
  
  // Use primary asset as proxy for portfolio performance, fallback to SPY
  const asset: AssetMetadata = primaryAsset || { ticker: 'SPY', assetType: 'Stock' };
  const { data: historicalData = [], isLoading, isError } = useHistoricalData(asset, range, !!asset);

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (isError) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive">Failed to load performance data</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  const chartData = historicalData.map(point => ({
    timestamp: point.timestamp,
    value: point.value,
    date: format(new Date(point.timestamp), 'MMM d'),
  }));

  return (
    <div className="space-y-4">
      <Tabs value={range} onValueChange={setRange}>
        <TabsList>
          {RANGES.map(r => (
            <TabsTrigger key={r.value} value={r.value}>
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
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
    </div>
  );
}
