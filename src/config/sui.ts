import { getFullnodeUrl } from '@mysten/sui/client'
import { createNetworkConfig } from '@mysten/dapp-kit'

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet') || 'testnet'

// Create network configuration
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  localnet: { 
    url: getFullnodeUrl('localnet'),
    variables: {
      myMovePackageId: '0x...',
    }
  },
  devnet: { 
    url: getFullnodeUrl('devnet'),
    variables: {
      myMovePackageId: '0x...',
    }
  },
  testnet: { 
    url: getFullnodeUrl('testnet'),
    variables: {
      myMovePackageId: '0x...',
    }
  },
  mainnet: { 
    url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl('mainnet'),
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