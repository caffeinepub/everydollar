# Specification

## Summary
**Goal:** Ensure backend portfolio reads consistently return current price data for every holding.

**Planned changes:**
- Update backend portfolio retrieval to enrich *all* holdings with `currentPrice` (price, change, changePercent, currency) before returning results.
- Apply the same “enrich every holding” behavior to public portfolio retrieval.
- Make enrichment resilient so a failed price lookup for one holding does not prevent other holdings from being enriched and returned.

**User-visible outcome:** When fetching portfolios (including public portfolios), every holding returned includes populated current price information rather than only a single holding showing price data.
