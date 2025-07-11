// Alchemy Smart Wallet Configuration
// API Key configured from environment variables

export const ALCHEMY_CONFIG = {
  // 🔑 Your API Key (from environment variable)
  apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || 'F8Va83aN01GrmwThYt8YGUfjkdqcGNeb', // Fallback for development
  
  // 🌐 Network Configuration
  network: import.meta.env.VITE_NETWORK || 'sepolia',
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '11155111'),
  
  // 🏠 Local Development Override
  localDevelopment: {
    enabled: true,
    network: 'localhost',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545'
  },
  
  // 💰 Gas Policy (optional - for sponsoring user transactions)
  gasPolicyId: undefined, // Set this if you want to sponsor gas fees
  
  // 🎮 Game Configuration
  gameTitle: 'Lumbridge NFT Game',
  appId: import.meta.env.VITE_ALCHEMY_APP_ID || 'lgtmun3ueqie9xi7',
  
  // 📝 Contract addresses
  contracts: {
    // Localhost contract address
    localhost: import.meta.env.VITE_CONTRACT_ADDRESS_LOCALHOST || '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    // Sepolia contract address (from environment variable)
    sepolia: import.meta.env.VITE_CONTRACT_ADDRESS_SEPOLIA || undefined,
  }
}

// Smart Wallet Features that will be available:
export const SMART_WALLET_FEATURES = {
  // ✨ User Experience
  noWalletRequired: true,           // Users don't need MetaMask
  socialLogin: true,                // Login with Google, Facebook, etc.
  emailLogin: true,                 // Login with email
  
  // 💸 Gas Management
  gasSponsorship: true,             // Sponsor user transactions
  batchTransactions: true,          // Batch multiple actions
  
  // 🔒 Security
  accountAbstraction: true,         // Smart contract wallets
  recoveryOptions: true,            // Social recovery
  sessionKeys: true,                // Temporary permissions
  
  // 🎮 Gaming Features
  automaticTransactions: true,      // Pre-approve game actions
  offchainSignatures: true,         // Faster interactions
  crossChainSupport: true,          // Multi-chain gaming
}

// Function to check if Alchemy is properly configured
export const checkAlchemySetup = () => {
  const apiKey = ALCHEMY_CONFIG.apiKey
  return apiKey && apiKey !== 'your-api-key-here' && apiKey !== 'your_alchemy_api_key_here'
}

// Updated instructions for localhost development
export const SETUP_INSTRUCTIONS = `
✅ API Key Configured!

🔮 Your Smart Wallet Setup:

1. ✅ API Key: ${ALCHEMY_CONFIG.apiKey ? 'Configured' : 'Missing'}
2. ✅ App ID: ${ALCHEMY_CONFIG.appId}
3. ✅ Network: Ready for testing

🚀 Next Steps:

Option A - Test with Localhost:
- Your game will continue working with MetaMask
- Smart wallet features will be simulated for testing
- Contract: ${ALCHEMY_CONFIG.contracts.localhost}

Option B - Deploy to Sepolia:
- We can deploy your contract to Sepolia testnet
- Enable full smart wallet features with real NFTs
- Get free testnet ETH from faucets

💰 Optional - Gas Sponsorship:
- In Alchemy dashboard, go to "Account Kit"
- Create a Gas Policy
- Add the policy ID to sponsor user transactions

🎮 Smart Wallet Benefits:
- No wallet installation for players
- Login with Google/Facebook/Email
- Sponsored gas fees (optional)
- Better security and UX
- Real NFT storage in smart wallets
`

export const getAlchemyStatus = () => {
  if (!checkAlchemySetup()) {
    return {
      status: 'needs_setup',
      message: 'Please configure your Alchemy API key in environment variables',
      instructions: SETUP_INSTRUCTIONS
    }
  }
  
  return {
    status: 'ready',
    message: 'Alchemy Smart Wallet configured and ready!',
    features: SMART_WALLET_FEATURES
  }
}

// Helper function to get the appropriate network config
export const getNetworkConfig = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  if (isLocalhost && ALCHEMY_CONFIG.localDevelopment.enabled) {
    return {
      network: ALCHEMY_CONFIG.localDevelopment.network,
      chainId: ALCHEMY_CONFIG.localDevelopment.chainId,
      rpcUrl: ALCHEMY_CONFIG.localDevelopment.rpcUrl,
      contractAddress: ALCHEMY_CONFIG.contracts.localhost
    }
  }
  
  return {
    network: ALCHEMY_CONFIG.network,
    chainId: ALCHEMY_CONFIG.chainId,
    rpcUrl: `https://eth-${ALCHEMY_CONFIG.network}.g.alchemy.com/v2/${ALCHEMY_CONFIG.apiKey}`,
    contractAddress: ALCHEMY_CONFIG.contracts.sepolia
  }
}

// Helper function to get contract address based on current network
export const getContractAddress = () => {
  const networkConfig = getNetworkConfig()
  return networkConfig.contractAddress
} 