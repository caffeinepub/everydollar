import type { Portfolio } from '../../backend';
import type { QuoteData } from '../../hooks/useMarketData';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationDonutChartProps {
  portfolio: Portfolio;
  quotes: QuoteData[];
}

export default function AllocationDonutChart({ portfolio, quotes }: AllocationDonutChartProps) {
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

  // Only include holdings that have live quotes
  const data = portfolio.holdings
    .map(h => {
      const quote = quoteMap.get(h.ticker);
      if (!quote) return null;
      
      const value = h.shares * quote.price;

      return {
        name: h.ticker,
        value,
        color: h.color,
      };
    })
    .filter((item): item is { name: string; value: number; color: string } => item !== null);

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No holdings with live prices to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => {
            const total = data.reduce((sum, d) => sum + d.value, 0);
            const percent = ((entry.payload.value / total) * 100).toFixed(1);
            return `${value} (${percent}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
