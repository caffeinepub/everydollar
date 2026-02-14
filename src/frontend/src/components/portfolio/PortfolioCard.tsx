import { navigate } from '../../App';
import type { Portfolio } from '../../backend';
import type { QuoteData } from '../../hooks/useMarketData';
import { calculatePortfolioMetrics } from '../../lib/portfolioMath';
import { formatSignedUSD } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface PortfolioCardProps {
  portfolio: Portfolio;
  quotes: QuoteData[];
}

export default function PortfolioCard({ portfolio, quotes }: PortfolioCardProps) {
  const metrics = calculatePortfolioMetrics(portfolio, quotes);
  const isPositive = metrics.dailyChange >= 0;

  // Generate sparkline data (mock for now)
  const sparklineData = Array.from({ length: 30 }, (_, i) => ({
    value: metrics.totalValue * (0.95 + Math.random() * 0.1),
  }));

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(`/portfolio/${encodeURIComponent(portfolio.name)}`)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{portfolio.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-3xl font-bold">
            ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-sm flex items-center gap-1 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {formatSignedUSD(metrics.dailyChange)} ({metrics.dailyChangePercent.toFixed(2)}%)
          </div>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Total Return:</span>
          <span className={metrics.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}>
            {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturnPercent.toFixed(2)}%
          </span>
        </div>

        <div className="h-12 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-muted-foreground">
          {metrics.holdingsCount} {metrics.holdingsCount === 1 ? 'holding' : 'holdings'}
        </div>
      </CardContent>
    </Card>
  );
}
