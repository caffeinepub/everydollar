# Specification

## Summary
**Goal:** Keep crypto search, live pricing, and historical charts working during CoinGecko outages by adding an automatic CoinPaprika fallback.

**Planned changes:**
- Implement backend fallback logic so each crypto market-data request tries CoinGecko first and automatically retries via CoinPaprika on failure (network error, non-2xx, invalid JSON, or missing expected fields).
- Apply fallback behavior to all existing crypto endpoints used by the frontend: searchCryptoTickers, getCryptoLivePrice, and getCryptoHistoricalData.
- Ensure fallback is per-request (no sticky mode) so the backend switches back to CoinGecko automatically on subsequent successful requests.
- Update the frontend market-data/parsing layer to handle fallback responses while preserving the existing per-symbol cached-live-quote behavior on partial failures.
- Keep fallback usage silent in the UI (no new alerts/banners/toasts).

**User-visible outcome:** Crypto search, quotes, and charts continue to function during CoinGecko disruptions without any new UI indicators.
