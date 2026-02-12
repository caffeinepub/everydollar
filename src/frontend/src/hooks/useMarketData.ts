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
            // Fetch from CoinGecko
            const resolvedCryptoId = cryptoId || resolveCryptoId(ticker);
            if (!resolvedCryptoId) {
              throw new Error(`Cannot resolve crypto ID for ${ticker}`);
            }
            
            const response = await actor.getCryptoLivePrice(resolvedCryptoId);
            return parseCryptoLivePrice(response, ticker, resolvedCryptoId);
          } else {
            // Fetch from Yahoo
            const normalized = normalizeSymbol(ticker);
            const html = await actor.fetchYahooData(normalized);
            return parseYahooQuote(html, ticker);
          }
        })
      );

      return results
        .filter((r): r is PromiseFulfilledResult<QuoteData> => r.status === 'fulfilled')
        .map(r => r.value);
    },
    enabled: !!actor && !actorFetching && enabled && assets.length > 0,
    refetchInterval: 60000,
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
        
        const cryptoResults = cryptoResponse.status === 'fulfilled'
          ? parseCryptoSearch(cryptoResponse.value)
          : [];
        
        // Cache crypto IDs for later use
        cryptoResults.forEach(result => {
          if (result.cryptoId) {
            cryptoIdCache.set(result.symbol.toUpperCase(), result.cryptoId);
          }
        });
        
        // Merge results, crypto first
        return [...cryptoResults, ...yahooResults];
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
        // Fetch from CoinGecko
        const resolvedCryptoId = cryptoId || resolveCryptoId(ticker);
        if (!resolvedCryptoId) {
          throw new Error(`Cannot resolve crypto ID for ${ticker}`);
        }
        
        const days = mapRangeToCryptoDays(range);
        const response = await actor.getCryptoHistoricalData(resolvedCryptoId, 'usd', days);
        return parseCryptoHistorical(response);
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
