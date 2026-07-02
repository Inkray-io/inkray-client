# Inkray — Web Client

The web app for **Inkray**, a publishing platform where creators truly own their
work. Writers publish permanently to decentralized storage and earn directly
through subscriptions, tips, and collectible article NFTs — no middlemen, no
platform lock-in.

Built with **Next.js 15** (App Router) and the **Sui** stack.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling
- **TanStack Query** for data fetching and caching
- **Sui** — `@mysten/dapp-kit`, `@mysten/sui` for wallet + on-chain calls
- **Walrus** for decentralized content storage
- **Seal** for encrypted, gated content
- **Enoki** for zkLogin sign-in
- **Algolia** for search
- PWA support via **Serwist**

## Getting started

Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3100](http://localhost:3100).

## Scripts

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Start the dev server (Turbopack) on port 3100  |
| `npm run build` | Production build                               |
| `npm run start` | Serve the production build                     |
| `npm run lint`  | Run ESLint                                     |

## Configuration

Configuration is driven by `NEXT_PUBLIC_*` environment variables. Copy the
example file and fill in your values:

```bash
cp .env.example .env.local
```

Key variables:

- `NEXT_PUBLIC_NETWORK` — `mainnet` | `testnet` | `devnet`
- `NEXT_PUBLIC_API_URL` — base URL of the Inkray backend API
- `NEXT_PUBLIC_PACKAGE_ID` — deployed Move package ID
- `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL` / `NEXT_PUBLIC_WALRUS_PUBLISHER_URL` — Walrus endpoints
- `NEXT_PUBLIC_SEAL_API_URL` / `NEXT_PUBLIC_SEAL_API_KEY` — Seal key server access
- `NEXT_PUBLIC_ENOKI_API_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — zkLogin sign-in
- `NEXT_PUBLIC_ALGOLIA_APP_ID` / `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` — search

## Project structure

```
src/
├── app/            # App Router routes (feed, article, profile, create, …)
├── components/     # UI, layout, feed, article, editor, widgets
├── hooks/          # Data + wallet hooks (TanStack Query)
├── contexts/       # Auth and provider contexts
├── lib/            # Config, Sui/Walrus/Seal clients, utils
├── constants/      # Routes, categories, static config
└── types/          # Shared TypeScript types
```

## License

Licensed under the [Apache License 2.0](./LICENSE).
