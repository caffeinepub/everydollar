# Specification

## Summary
**Goal:** Force light mode on all public (unauthenticated) pages while keeping existing theme behavior unchanged for authenticated routes.

**Planned changes:**
- Detect public/unauthenticated app states (public portfolio route, login/unauthenticated screens, and initializing/loading state) and apply a forced light theme on those views.
- Update theme provider configuration for public/unauthenticated routes so the document root class is consistently set to `light`, ignoring system theme and any persisted user preference.
- Ensure authenticated routes continue using the current theme behavior (including dark default and any existing theme toggle).

**User-visible outcome:** Public portfolio pages and unauthenticated/login/initializing screens always render in light mode regardless of OS theme or any prior dark-mode selection, while authenticated pages keep their current theming behavior.
