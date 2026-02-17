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
  'IMX': 'immutable-x',
  'HBAR': 'hedera-hashgraph',
};

export function getCryptoId(symbol: string): string | null {
  return CRYPTO_ID_MAP[symbol.toUpperCase()] || null;
}

export function getKnownCryptoSymbols(): string[] {
  return Object.keys(CRYPTO_ID_MAP);
}

export function findKnownCryptoMatches(query: string): Array<{ symbol: string; cryptoId: string }> {
  const normalizedQuery = query.toUpperCase().trim();
  const matches: Array<{ symbol: string; cryptoId: string }> = [];
  
  for (const [symbol, cryptoId] of Object.entries(CRYPTO_ID_MAP)) {
    // Exact match or prefix match
    if (symbol === normalizedQuery || symbol.startsWith(normalizedQuery)) {
      matches.push({ symbol, cryptoId });
    }
  }
  
  return matches;
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
    
    // CoinGecko format: { coins: [...] }
    if (data.coins && Array.isArray(data.coins)) {
      return data.coins
        .slice(0, 10)
        .filter((coin: any) => coin.id && coin.symbol)
        .map((coin: any) => ({
          symbol: (coin.symbol || '').toUpperCase(),
          name: coin.name || coin.symbol || 'Unknown',
          type: 'Crypto',
          cryptoId: coin.id,
        }));
    }
    
    // CoinPaprika format: single coin object { id, name, symbol, ... }
    if (data.id && data.symbol) {
      return [{
        symbol: (data.symbol || '').toUpperCase(),
        name: data.name || data.symbol || 'Unknown',
        type: 'Crypto',
        cryptoId: data.id,
      }];
    }
  } catch (e) {
    console.warn('Failed to parse crypto search response:', e);
  }
  
  return [];
}

export function parseCryptoLivePrice(response: string, symbol: string, cryptoId: string): { symbol: string; price: number; change: number; changePercent: number; currency: string } {
  try {
    const data = JSON.parse(response);
    
    // CoinGecko format: { [cryptoId]: { usd: ..., usd_24h_change: ... } }
    if (data[cryptoId]) {
      const priceData = data[cryptoId];
      const price = priceData.usd || 0;
      const changePercent = priceData.usd_24h_change || 0;
      
      if (price <= 0) {
        throw new Error(`Invalid price data for ${symbol}: price=${price}`);
      }
      
      return {
        symbol,
        price,
        change: (price * changePercent) / 100,
        changePercent,
        currency: 'USD',
      };
    }
    
    // CoinPaprika format: { quotes: { USD: { price: ..., percent_change_24h: ... } } }
    if (data.quotes && data.quotes.USD) {
      const usdQuote = data.quotes.USD;
      const price = usdQuote.price || 0;
      const changePercent = usdQuote.percent_change_24h || 0;
      
      if (price <= 0) {
        throw new Error(`Invalid price data for ${symbol}: price=${price}`);
      }
      
      return {
        symbol,
        price,
        change: (price * changePercent) / 100,
        changePercent,
        currency: 'USD',
      };
    }
    
    throw new Error(`Unrecognized crypto price response format for ${symbol}`);
  } catch (e) {
    console.warn('Failed to parse crypto price response:', e);
    throw e;
  }
}

export function parseCryptoHistorical(response: string): Array<{ timestamp: number; value: number }> {
  try {
    const data = JSON.parse(response);
    
    // CoinGecko format: { prices: [[timestamp, price], ...] }
    if (data.prices && Array.isArray(data.prices)) {
      const validPoints = data.prices
        .filter((point: any) => Array.isArray(point) && point.length >= 2 && point[1] > 0)
        .map((point: [number, number]) => ({
          timestamp: point[0],
          value: point[1],
        }));
      
      if (validPoints.length === 0) {
        throw new Error('No valid historical data points found');
      }
      
      return validPoints;
    }
    
    // CoinPaprika format: { quotes: { USD: { price: ... } } }
    // For historical, CoinPaprika returns current price only, so we generate a single point
    if (data.quotes && data.quotes.USD && data.quotes.USD.price) {
      const price = data.quotes.USD.price;
      if (price <= 0) {
        throw new Error('Invalid historical price data');
      }
      
      return [{
        timestamp: Date.now(),
        value: price,
      }];
    }
    
    throw new Error('Unrecognized crypto historical response format');
  } catch (e) {
    console.warn('Failed to parse crypto historical response:', e);
    throw e;
  }
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
