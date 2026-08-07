import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { nanoid } from "nanoid";
import path from "node:path";

// The 7K aggregator SDK lazily imports every provider (Bluefin7k, Cetus, FlowX,
// OKX) at construction; we only enable Bluefin7k for tips. Alias the two unused,
// heavy provider SDKs — which we deliberately don't install — to a stub that
// throws on import, matching the "not installed" path the 7K SDK handles
// gracefully. Without this the bundler fails to resolve them.
const SEVEN_K_UNUSED_PROVIDERS = [
  "@flowx-finance/sdk",
  "@cetusprotocol/aggregator-sdk",
];
const SEVEN_K_PROVIDER_STUB = path.resolve(
  process.cwd(),
  "src/lib/7k-unavailable-provider.ts",
);

const withSerwist = withSerwistInit({
  disable: process.env.NODE_ENV === 'development',
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: false,
  additionalPrecacheEntries: [
    {
      url: 'offline/article',
      revision: nanoid(6)
    }
  ]
});

const nextConfig: NextConfig = {
  serverExternalPackages: [ '@mysten/walrus', '@mysten/walrus-wasm' ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.prod.website-files.com' },
      { protocol: 'https', hostname: '*.inkray.xyz' },
      { protocol: 'https', hostname: '*.walrus.space' },
    ],
  },
  // Dev (turbopack): alias the unused 7K providers to the throwing stub.
  turbopack: {
    resolveAlias: Object.fromEntries(
      SEVEN_K_UNUSED_PROVIDERS.map((pkg) => [
        pkg,
        "./src/lib/7k-unavailable-provider.ts",
      ]),
    ),
  },
  // Prod (`next build`, webpack): same alias, plus browser shims for the Node
  // built-ins the 7K/Bluefin7k/Pyth swap stack imports.
  webpack: (config, { webpack }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      ...Object.fromEntries(
        SEVEN_K_UNUSED_PROVIDERS.map((pkg) => [pkg, SEVEN_K_PROVIDER_STUB]),
      ),
    };
    // Pyth imports `node:buffer` (→ the installed `buffer` polyfill); the 7K SDK
    // lazily imports `node:crypto` only on the OKX path, which we never enable.
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      crypto: false,
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );
    return config;
  },
};

export default withSerwist(nextConfig);
