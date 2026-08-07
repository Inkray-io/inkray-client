/**
 * Tip payment builder.
 *
 * A tip is always delivered to the creator as SUI (the on-chain
 * `platform_economics::tip_publication` move call takes a `Coin<SUI>`). When the
 * reader pays with a different token, we route the token → SUI through the 7K
 * meta-aggregator *inside the same transaction*, so the swap and the tip either
 * both succeed or both revert — the reader never ends up with a loose swapped
 * coin.
 *
 * Only the Bluefin7k provider is enabled: it's the 7K-native aggregator, works
 * with the app's default (gRPC) client, and — unlike Cetus (JSON-RPC only) or
 * OKX (build-on-the-fly, can't be appended to a PTB) — supports the composable
 * `swap()` we need. 7K aggregates *mainnet* liquidity only, so token→SUI swaps
 * are mainnet-only; on other networks the UI stays on the SUI-only path (see
 * `isTipSwapSupported`).
 *
 * The `@7kprotocol/sdk-ts` runtime is loaded lazily so the SUI-only path (and
 * every non-mainnet build) never pulls the swap SDK into the bundle.
 */
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import type { TransactionObjectArgument } from '@mysten/sui/transactions';
import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { MetaAg, MetaQuote } from '@7kprotocol/sdk-ts';
import { INKRAY_CONFIG } from './sui-clients';

/** Short and fully-normalized forms of the SUI coin type. */
export const SUI_COIN_TYPE = '0x2::sui::SUI';
const NORMALIZED_SUI_COIN_TYPE =
  '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

/** Default max slippage for the token→SUI swap (1%). */
export const DEFAULT_TIP_SLIPPAGE_BPS = 100;

export function isSuiCoinType(coinType: string): boolean {
  return coinType === SUI_COIN_TYPE || coinType === NORMALIZED_SUI_COIN_TYPE;
}

/**
 * Whether paying a tip with a non-SUI token is available. 7K only aggregates
 * mainnet liquidity, so token→SUI swaps only work on mainnet; elsewhere the tip
 * UI restricts to SUI.
 */
export function isTipSwapSupported(): boolean {
  return INKRAY_CONFIG.NETWORK === 'mainnet';
}

// Lazily-loaded SDK module so the swap runtime stays out of the SUI-only path.
let sdkPromise: Promise<typeof import('@7kprotocol/sdk-ts')> | null = null;
function loadSdk() {
  return (sdkPromise ??= import('@7kprotocol/sdk-ts'));
}

let cached: { client: ClientWithCoreApi; meta: MetaAg } | null = null;

async function getMetaAg(client: ClientWithCoreApi): Promise<MetaAg> {
  if (cached && cached.client === client) return cached.meta;
  const { MetaAg, EProvider } = await loadSdk();
  const meta = new MetaAg({
    client,
    // Bluefin7k only — the one composable, client-agnostic provider (see file header).
    providers: { [EProvider.BLUEFIN7K]: {} },
    slippageBps: DEFAULT_TIP_SLIPPAGE_BPS,
  });
  cached = { client, meta };
  return meta;
}

export interface TipQuote {
  /** Raw 7K quote, passed back into `buildTipTransaction`. */
  quote: MetaQuote;
  /** SUI the creator receives, in MIST (after any provider commission). */
  amountOut: bigint;
}

/**
 * Best token→SUI quote for a tip. Returns `null` when no route exists (e.g. on
 * testnet, or for an illiquid token) — callers should treat that as
 * "swapping this token isn't available right now".
 */
export async function getTipQuote(params: {
  client: ClientWithCoreApi;
  coinTypeIn: string;
  amountIn: bigint;
  signer?: string;
}): Promise<TipQuote | null> {
  const { client, coinTypeIn, amountIn, signer } = params;
  if (amountIn <= BigInt(0)) return null;

  const meta = await getMetaAg(client);
  const quotes = await meta.quote({
    coinTypeIn,
    coinTypeOut: SUI_COIN_TYPE,
    amountIn: amountIn.toString(),
    signer,
  });

  if (quotes.length === 0) return null;

  const best = quotes.reduce((a, b) =>
    BigInt(b.amountOut) > BigInt(a.amountOut) ? b : a,
  );
  return { quote: best, amountOut: BigInt(best.amountOut) };
}

export interface BuildTipParams {
  client: ClientWithCoreApi;
  publicationId: string;
  /** Coin the reader pays with. */
  coinTypeIn: string;
  /** Amount of `coinTypeIn` to spend, in that token's smallest unit. */
  amountIn: bigint;
  /** Reader's address (owner of the input coin). */
  signer: string;
  /** Required when `coinTypeIn` is not SUI — a fresh quote from `getTipQuote`. */
  quote?: MetaQuote;
  slippageBps?: number;
}

/**
 * Build the tip transaction. For SUI this is a direct split-and-tip (identical to
 * the original flow). For any other token it appends a swap → SUI to the same PTB
 * and tips with the swapped coin, so the whole thing is atomic.
 */
export async function buildTipTransaction(
  params: BuildTipParams,
): Promise<Transaction> {
  const {
    client,
    publicationId,
    coinTypeIn,
    amountIn,
    signer,
    quote,
    slippageBps = DEFAULT_TIP_SLIPPAGE_BPS,
  } = params;

  const tx = new Transaction();
  let tipCoin: TransactionObjectArgument;

  if (isSuiCoinType(coinTypeIn)) {
    // Pay directly in SUI — split off the tip from the gas coin.
    [tipCoin] = tx.splitCoins(tx.gas, [amountIn]);
  } else {
    if (!quote) {
      throw new Error('A swap quote is required to tip with this token.');
    }
    // Take exactly `amountIn` of the token from the reader's coins, then swap it
    // to SUI. `swap` appends the swap commands and returns the output SUI coin.
    const coinIn = coinWithBalance({
      type: coinTypeIn,
      balance: amountIn,
      useGasCoin: false,
    })(tx);
    const meta = await getMetaAg(client);
    tipCoin = await meta.swap({ quote, signer, tx, coinIn }, slippageBps);
  }

  tx.moveCall({
    target: `${INKRAY_CONFIG.PACKAGE_ID}::platform_economics::tip_publication`,
    arguments: [
      tx.object(INKRAY_CONFIG.GLOBAL_CONFIG_ID),
      tx.object(publicationId),
      tipCoin,
    ],
  });

  return tx;
}
