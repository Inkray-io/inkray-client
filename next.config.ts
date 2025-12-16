import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { nanoid } from "nanoid";

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
  output: 'export',
  serverExternalPackages: [ '@mysten/walrus', '@mysten/walrus-wasm' ],
};

export default withSerwist(nextConfig);
