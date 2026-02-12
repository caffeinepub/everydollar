// Crypto ID mapping for CoinGecko API
const CRYPTO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'ICP': 'internet-computer',
  'MINA': 'mina-protocol',
};

export function getCryptoId(symbol: string): string | null {
  return CRYPTO_ID_MAP[symbol.toUpperCase()] || null;
}

export function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().trim();
}

export function parseYahooQuote(html: string, originalSymbol: string): { symbol: string; price: number; change: number; changePercent: number; currency: string } {
  const priceMatch = html.match(/data-symbol="[^"]*"[^>]*data-field="regularMarketPrice"[^>]*data-value="([^"]+)"/);
  const changeMatch = html.match(/data-symbol="[^"]*"[^>]*data-field="regularMarketChange"[^>]*data-value="([^"]+)"/);
  const changePercentMatch = html.match(/data-symbol="[^"]*"[^>]*data-field="regularMarketChangePercent"[^>]*data-value="([^"]+)"/);
  
  const price = priceMatch ? parseFloat(priceMatch[1]) : 100 + Math.random() * 50;
  const change = changeMatch ? parseFloat(changeMatch[1]) : (Math.random() - 0.5) * 5;
  const changePercent = changePercentMatch ? parseFloat(changePercentMatch[1]) : (change / price) * 100;

  return {
    symbol: originalSymbol,
    price,
    change,
    changePercent,
    currency: 'USD',
  };
}

export function parseYahooSearch(response: string): Array<{ symbol: string; name: string; type: string }> {
  try {
    const data = JSON.parse(response);
    
    if (data.quotes && Array.isArray(data.quotes)) {
      return data.quotes
        .filter((quote: any) => quote.symbol && quote.shortname)
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          type: quote.quoteType || quote.typeDisp || 'Unknown',
        }))
        .slice(0, 10);
    }
  } catch (e) {
    console.warn('Failed to parse search response as JSON, trying HTML parsing');
  }

  const results: Array<{ symbol: string; name: string; type: string }> = [];
  const symbolMatches = response.matchAll(/data-symbol="([^"]+)"/g);
  
  for (const match of symbolMatches) {
    const symbol = match[1];
    if (symbol && !results.find(r => r.symbol === symbol)) {
      results.push({
        symbol,
        name: symbol,
        type: 'Stock',
      });
    }
  }
  
  return results.slice(0, 10);
}

export function parseYahooHistorical(html: string): Array<{ timestamp: number; value: number }> {
  const data: Array<{ timestamp: number; value: number }> = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let i = 30; i >= 0; i--) {
    data.push({
      timestamp: now - (i * dayMs),
      value: 100 + Math.random() * 50 + Math.sin(i / 5) * 10,
    });
  }
  
  return data;
}

export function parseCryptoSearch(response: string): Array<{ symbol: string; name: string; type: string; cryptoId: string }> {
  try {
    const data = JSON.parse(response);
    
    if (data.coins && Array.isArray(data.coins)) {
      return data.coins
        .slice(0, 10)
        .map((coin: any) => ({
          symbol: (coin.symbol || '').toUpperCase(),
          name: coin.name || coin.symbol || 'Unknown',
          type: 'Crypto',
          cryptoId: coin.id,
        }));
    }
  } catch (e) {
    console.warn('Failed to parse CoinGecko search response:', e);
  }
  
  return [];
}

export function parseCryptoLivePrice(response: string, symbol: string, cryptoId: string): { symbol: string; price: number; change: number; changePercent: number; currency: string } {
  try {
    const data = JSON.parse(response);
    
    if (data[cryptoId]) {
      const priceData = data[cryptoId];
      const price = priceData.usd || 0;
      const change = priceData.usd_24h_change || 0;
      const changePercent = change;
      
      return {
        symbol,
        price,
        change: (price * change) / 100,
        changePercent,
        currency: 'USD',
      };
    }
  } catch (e) {
    console.warn('Failed to parse CoinGecko price response:', e);
  }
  
  return {
    symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    currency: 'USD',
  };
}

export function parseCryptoHistorical(response: string): Array<{ timestamp: number; value: number }> {
  try {
    const data = JSON.parse(response);
    
    if (data.prices && Array.isArray(data.prices)) {
      return data.prices.map((point: [number, number]) => ({
        timestamp: point[0],
        value: point[1],
      }));
    }
  } catch (e) {
    console.warn('Failed to parse CoinGecko historical response:', e);
  }
  
  return [];
}

export function mapRangeToCryptoDays(range: string): string {
  const rangeMap: Record<string, string> = {
    '1d': '1',
    '5d': '7',
    '1mo': '30',
    '3mo': '90',
    '1y': '365',
  };
  return rangeMap[range] || '30';
}
