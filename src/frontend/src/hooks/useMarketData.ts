import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  normalizeSymbol,
  parseYahooQuote,
  parseYahooSearch,
  parseYahooHistorical,
  parseCryptoSearch,
  parseCryptoLivePrice,
  parseCryptoHistorical,
  getCryptoId,
  mapRangeToCryptoDays,
  findKnownCryptoMatches,
} from '../lib/symbols';

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  cryptoId?: string;
}

export interface HistoricalPoint {
  timestamp: number;
  value: number;
}

export interface AssetMetadata {
  ticker: string;
  assetType?: string;
  cryptoId?: string;
}

// In-memory cache for crypto symbol -> cryptoId resolution
const cryptoIdCache = new Map<string, string>();

// Per-symbol live quote cache (persists across refetches)
const liveQuoteCache = new Map<string, QuoteData>();

function resolveCryptoId(symbol: string): string | null {
  const normalized = symbol.toUpperCase();
  
  // Check cache first
  if (cryptoIdCache.has(normalized)) {
    return cryptoIdCache.get(normalized)!;
  }
  
  // Check known mapping
  const knownId = getCryptoId(normalized);
  if (knownId) {
    cryptoIdCache.set(normalized, knownId);
    return knownId;
  }
  
  return null;
}

function isCryptoAsset(assetType?: string): boolean {
  return assetType?.toLowerCase() === 'crypto' || assetType?.toLowerCase() === 'cryptocurrency';
}

export function useLiveQuotes(assets: (string | AssetMetadata)[], enabled = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<QuoteData[]>({
    queryKey: ['quotes', JSON.stringify(assets)],
    queryFn: async () => {
      if (!actor || assets.length === 0) return [];
      
      const results = await Promise.allSettled(
        assets.map(async (asset) => {
          const metadata = typeof asset === 'string' ? { ticker: asset } : asset;
          const { ticker, assetType, cryptoId } = metadata;
          
          // Determine if this is a crypto asset
          if (isCryptoAsset(assetType)) {
            // Fetch from CoinGecko (with CoinPaprika fallback)
            const resolvedCryptoId = cryptoId || resolveCryptoId(ticker);
            if (!resolvedCryptoId) {
              throw new Error(`Cannot resolve crypto ID for ${ticker}`);
            }
            
            const response = await actor.getCryptoLivePrice(resolvedCryptoId);
            const parsed = parseCryptoLivePrice(response, ticker, resolvedCryptoId);
            
            // Validate parsed data
            if (!parsed || parsed.price <= 0) {
              throw new Error(`Invalid price data for ${ticker}`);
            }
            
            return parsed;
          } else {
            // Fetch from Yahoo
            const normalized = normalizeSymbol(ticker);
            const html = await actor.fetchYahooData(normalized);
            return parseYahooQuote(html, ticker);
          }
        })
      );

      // Update cache only for successfully fetched symbols with valid data
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const quote = result.value;
          // Only cache if we have valid price data
          if (quote && quote.price > 0) {
            const normalizedSymbol = quote.symbol.toUpperCase();
            liveQuoteCache.set(normalizedSymbol, quote);
          }
        }
      });

      // Build result array from cache for all requested assets
      const quotesFromCache = assets
        .map(asset => {
          const metadata = typeof asset === 'string' ? { ticker: asset } : asset;
          const normalizedSymbol = metadata.ticker.toUpperCase();
          return liveQuoteCache.get(normalizedSymbol);
        })
        .filter((q): q is QuoteData => q !== undefined);

      return quotesFromCache;
    },
    enabled: !!actor && !actorFetching && enabled && assets.length > 0,
    refetchInterval: 300000, // 5 minutes
    staleTime: 50000,
  });
}

export function useTickerSearch(query: string, minLength: number = 2) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!actor || !query || query.length < minLength) return [];
      
      try {
        // Fetch both Yahoo and CoinGecko results in parallel
        const [yahooResponse, cryptoResponse] = await Promise.allSettled([
          actor.searchTickers(query),
          actor.searchCryptoTickers(query),
        ]);
        
        const yahooResults = yahooResponse.status === 'fulfilled' 
          ? parseYahooSearch(yahooResponse.value) 
          : [];
        
        let cryptoResults: SearchResult[] = [];
        
        // Parse crypto results (CoinGecko or CoinPaprika fallback)
        if (cryptoResponse.status === 'fulfilled') {
          try {
            cryptoResults = parseCryptoSearch(cryptoResponse.value);
          } catch (e) {
            console.warn('Failed to parse crypto search results:', e);
          }
        }
        
        // Check if query matches any known crypto symbols (exact or prefix)
        const knownMatches = findKnownCryptoMatches(query);
        
        // Inject known crypto matches that aren't already in cryptoResults
        for (const match of knownMatches) {
          const alreadyExists = cryptoResults.some(
            r => r.symbol.toUpperCase() === match.symbol.toUpperCase()
          );
          
          if (!alreadyExists) {
            cryptoResults.unshift({
              symbol: match.symbol,
              name: match.symbol,
              type: 'Crypto',
              cryptoId: match.cryptoId,
            });
          }
        }
        
        // Cache crypto IDs for later use
        cryptoResults.forEach(result => {
          if (result.cryptoId) {
            cryptoIdCache.set(result.symbol.toUpperCase(), result.cryptoId);
          }
        });
        
        // Dedupe: create a map by normalized symbol, preferring Crypto over Yahoo
        const resultMap = new Map<string, SearchResult>();
        
        // Add Yahoo results first
        yahooResults.forEach(result => {
          const key = result.symbol.toUpperCase();
          resultMap.set(key, result);
        });
        
        // Add crypto results, overwriting any Yahoo duplicates
        cryptoResults.forEach(result => {
          const key = result.symbol.toUpperCase();
          resultMap.set(key, result);
        });
        
        // Convert back to array, crypto first
        const dedupedResults: SearchResult[] = [];
        
        // Add crypto results first
        cryptoResults.forEach(result => {
          const key = result.symbol.toUpperCase();
          if (resultMap.get(key) === result) {
            dedupedResults.push(result);
            resultMap.delete(key);
          }
        });
        
        // Add remaining Yahoo results
        resultMap.forEach(result => {
          dedupedResults.push(result);
        });
        
        return dedupedResults;
      } catch (error) {
        console.error('Ticker search error:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && query.length >= minLength,
    staleTime: 300000,
    retry: false,
  });
}

export function useHistoricalData(
  asset: string | AssetMetadata,
  range: string,
  enabled = true
) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<HistoricalPoint[]>({
    queryKey: ['historical', JSON.stringify(asset), range],
    queryFn: async () => {
      if (!actor) return [];
      
      const metadata = typeof asset === 'string' ? { ticker: asset } : asset;
      const { ticker, assetType, cryptoId } = metadata;
      
      // Determine if this is a crypto asset
      if (isCryptoAsset(assetType)) {
        // Fetch from CoinGecko (with CoinPaprika fallback)
        const resolvedCryptoId = cryptoId || resolveCryptoId(ticker);
        if (!resolvedCryptoId) {
          throw new Error(`Cannot resolve crypto ID for ${ticker}`);
        }
        
        const days = mapRangeToCryptoDays(range);
        const response = await actor.getCryptoHistoricalData(resolvedCryptoId, 'usd', days);
        const parsed = parseCryptoHistorical(response);
        
        // Validate parsed data
        if (!parsed || parsed.length === 0) {
          throw new Error(`No valid historical data for ${ticker}`);
        }
        
        return parsed;
      } else {
        // Fetch from Yahoo
        const normalized = normalizeSymbol(ticker);
        const html = await actor.fetchHistoricalData(normalized, range);
        return parseYahooHistorical(html);
      }
    },
    enabled: !!actor && !actorFetching && enabled && !!asset && !!range,
    staleTime: 300000,
  });
}
