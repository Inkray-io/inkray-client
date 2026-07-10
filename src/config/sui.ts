import { SuiGrpcClient } from '@mysten/sui/grpc'
import { createDAppKit } from '@mysten/dapp-kit-core'

const network =
  (process.env.NEXT_PUBLIC_NETWORK as
    | 'mainnet'
    | 'testnet'
    | 'devnet'
    | 'localnet') || 'testnet'

// gRPC runs on the SAME public full-node host/port as JSON-RPC; the browser
// SuiGrpcClient uses grpc-web (verified: the public endpoint sends CORS headers).
const GRPC_URLS: Record<string, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
}

/**
 * dApp Kit 2.0 instance. Replaces SuiClientProvider + WalletProvider +
 * createNetworkConfig. Reads go through `client.core.*` (transport-agnostic);
 * JSON-RPC is being deactivated (Jul 2026), so the client is gRPC.
 */
export const dAppKit = createDAppKit({
  networks: ['mainnet', 'testnet', 'devnet', 'localnet'],
  defaultNetwork: network,
  createClient: (net) =>
    new SuiGrpcClient({
      network: net as 'mainnet' | 'testnet' | 'devnet',
      baseUrl: GRPC_URLS[net] ?? GRPC_URLS.testnet,
    }),
  autoConnect: true,
})

// Register our instance so useDAppKit()/hooks infer its network + client types.
declare module '@mysten/dapp-kit-core' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}

export { network }
