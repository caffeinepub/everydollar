# Specification

## Summary
**Goal:** Integrate CoinGecko as the data source for crypto search, live quotes, and historical charts (including ICP and MINA) while keeping Yahoo Finance for stocks/ETFs.

**Planned changes:**
- Add backend CoinGecko-powered endpoints/functions for crypto ticker search, returning structured results suitable for a unified autocomplete list.
- Add backend CoinGecko-powered live crypto quote fetching (price, 24h change, 24h change percent, currency) with controlled error handling.
- Add backend CoinGecko-powered historical crypto price time series for the same chart ranges used by the app (sorted ascending by timestamp).
- Update frontend market-data hooks to route crypto search/quotes/history to the new CoinGecko-backed backend paths while continuing to use Yahoo-backed paths for non-crypto assets.
- Update ticker selection (top nav search + Add Holding modal) so selecting a crypto result sets/persists an appropriate crypto symbol representation and assetType (e.g., “Crypto”) without requiring a “-USD” suffix.
- Update Dashboard, Portfolio Detail, Public Portfolio, and Ticker Preview to display crypto prices and charts using CoinGecko data while preserving existing skeleton loading states.

**User-visible outcome:** Users can search and add crypto tickers like ICP and MINA without typing “-USD”, and see current prices and historical charts for crypto holdings and ticker previews powered by CoinGecko, alongside existing stock/ETF support.
