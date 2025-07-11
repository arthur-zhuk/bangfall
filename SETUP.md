# 🔧 Environment Setup Guide

## 🔒 Required Secrets (DO NOT COMMIT TO GITHUB)

When you pull this repository to your MacBook, you'll need to manually create these files:

### 1. Create `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env
```

### 2. Required Environment Variables:

```env
# Alchemy Configuration (REQUIRED)
VITE_ALCHEMY_API_KEY=F8Va83aN01GrmwThYt8YGUfjkdqcGNeb
VITE_ALCHEMY_APP_ID=lgtmun3ueqie9xi7

# Deployment Configuration (for Foundry)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHERSCAN_API_KEY=F8Va83aN01GrmwThYt8YGUfjkdqcGNeb

# Network Configuration
VITE_NETWORK=sepolia
VITE_CHAIN_ID=11155111

# Contract Addresses
VITE_CONTRACT_ADDRESS_LOCALHOST=0x0165878A594ca255338adfa4d48449f69242Eb8F
VITE_CONTRACT_ADDRESS_SEPOLIA=
```

## 🚀 Quick Setup Commands

After pulling the repository:

```bash
# Install dependencies
npm install

# Install Foundry dependencies (if needed)
cd contracts
forge install
cd ..

# Copy environment file
cp .env.example .env

# Edit with your values
# nano .env (or use your preferred editor)

# Start development server
npm run dev
```

## 🔐 Security Notes

### ✅ Safe in GitHub:
- All source code
- Configuration templates
- Documentation
- Package.json files

### ❌ NEVER commit:
- `.env` files
- `contracts/cache/` directory
- `contracts/broadcast/` directory
- Private keys
- API keys

## 🌐 Network Configuration

### Localhost (Development):
- Uses mock smart wallets
- Items stored in localStorage
- No real blockchain transactions

### Sepolia (Production):
- Uses real Alchemy Smart Wallets
- Items stored as real NFTs
- Real blockchain transactions

## 📝 Contract Deployment

To deploy to Sepolia:

```bash
cd contracts

# Deploy contract
forge script script/DeployGameItems.s.sol \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/$VITE_ALCHEMY_API_KEY \
  --broadcast \
  --private-key $PRIVATE_KEY

# Update .env with deployed contract address
echo "VITE_CONTRACT_ADDRESS_SEPOLIA=0x..." >> ../.env
```

## 🎮 Game Features

### Current Features:
- ✅ Enhanced sprites with directional movement
- ✅ Detailed environment objects
- ✅ Combat system with goblins
- ✅ Multiple activities (mining, fishing, cooking, woodcutting)
- ✅ Inventory system
- ✅ Smart wallet integration (mock on localhost)

### Real NFT Features (Sepolia):
- ✅ Real Alchemy Smart Wallet authentication
- ✅ Email/passkey login
- ✅ Real ERC-1155 NFT storage
- ✅ Cross-device inventory persistence
- ✅ Gasless transactions (with gas sponsorship)

## 🔧 Troubleshooting

### If environment variables aren't loading:
1. Ensure `.env` file is in root directory
2. Restart development server
3. Check that variables start with `VITE_`

### If smart wallet fails:
1. Check API key is correct
2. Ensure network is set to 'sepolia'
3. Verify contract is deployed to Sepolia

### If deployment fails:
1. Get Sepolia ETH from https://sepoliafaucet.com
2. Ensure private key has sufficient balance
3. Check network configuration

## 📞 Support

If you encounter issues:
1. Check this setup guide
2. Verify all environment variables are set
3. Ensure dependencies are installed
4. Try restarting the development server 