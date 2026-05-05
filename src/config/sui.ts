import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { createNetworkConfig } from '@mysten/dapp-kit'

const network = (process.env.NEXT_PUBLIC_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet') || 'testnet'

// Create network configuration
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  localnet: {
    url: getJsonRpcFullnodeUrl('localnet'),
    network: 'localnet',
    variables: {
      myMovePackageId: '0x...',
    }
  },
  devnet: {
    url: getJsonRpcFullnodeUrl('devnet'),
    network: 'devnet',
    variables: {
      myMovePackageId: '0x...',
    }
  },
  testnet: {
    url: getJsonRpcFullnodeUrl('testnet'),
    network: 'testnet',
    variables: {
      myMovePackageId: '0x...',
    }
  },
  mainnet: {
    url: getJsonRpcFullnodeUrl('mainnet'),
    network: 'mainnet',
    variables: {
      myMovePackageId: '0x...',
    }
  },
})

export { 
  networkConfig, 
  useNetworkVariable, 
  useNetworkVariables, 
  network 
}