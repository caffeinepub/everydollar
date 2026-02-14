# Specification

## Summary
**Goal:** Make portfolio holdings search/filtering case-insensitive so queries match holdings regardless of letter casing.

**Planned changes:**
- Update the holdings list/table text-filter logic to compare the query and holding fields (e.g., ticker) in a case-insensitive way.
- Ensure partial matching (if currently supported) remains case-insensitive while preserving the displayed/original ticker casing.

**User-visible outcome:** Users can search holdings with any casing (e.g., "icp" or "ICP") and get identical matching results without changing how tickers are displayed.
