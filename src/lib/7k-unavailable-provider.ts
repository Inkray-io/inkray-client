/**
 * Stand-in for the optional 7K aggregator provider SDKs we don't ship
 * (`@flowx-finance/sdk`, `@cetusprotocol/aggregator-sdk`). The 7K meta-aggregator
 * lazily imports every provider at construction; we only use Bluefin7k, so the
 * others are aliased to this module in `next.config.ts`.
 *
 * Throwing on import mirrors the "package not installed" path the 7K SDK already
 * catches gracefully (it logs "Please install …" and carries on with the
 * remaining providers), which keeps the two unused, heavy provider SDKs — and
 * their conflicting peer deps — out of the bundle.
 */
throw new Error(
  '7K aggregator provider intentionally not installed — only Bluefin7k is used for tips.',
);
