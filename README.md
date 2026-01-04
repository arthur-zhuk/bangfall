# Bangfall

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Phaser](https://img.shields.io/badge/Phaser-000000?style=for-the-badge&logo=phaser&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A browser-based Web3 MMO game built with React, TypeScript, and Phaser.js featuring stackable ERC-1155 tokens. Inspired by RuneScape Classic movement mechanics.

## Features

- **Click-to-Move System**: RuneScape Classic inspired movement mechanics
- **Resource Mining**: Click on rocks to mine them and collect stackable items
- **Real-time Inventory**: Track your collected resources with live updates
- **Responsive Game World**: 800x600 pixel game world with collision detection
- **Smart Mining**: Automatic pathfinding to resources when clicked
- **Resource Respawn**: Mined rocks respawn after 3 seconds

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Game Engine**: Phaser.js 3.90
- **Styling**: CSS with gradient backgrounds
- **Physics**: Arcade Physics for collision detection
- **Blockchain**: ERC-1155 token standard (planned)

## Installation

```bash
git clone https://github.com/arthur-zhuk/bangfall.git
cd bangfall
npm install
```

## Usage

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to play the game.

## How to Play

1. **Movement**: Click anywhere on the game world to move your character (blue circle)
2. **Mining**: Click on rocks (gray squares) to mine them
3. **Inventory**: Watch your inventory update in real-time as you collect resources
4. **Resource Respawn**: Mined rocks will respawn after 3 seconds

## Project Structure

```
src/
├── components/
│   └── Game.tsx          # Main game component
├── scenes/
│   └── GameScene.ts      # Phaser game scene with mechanics
├── App.tsx               # React app entry point
└── main.tsx             # Vite entry point
```

## Roadmap

### Smart Contract Features (ERC-1155)
- [ ] Deploy stackable NFT contracts for game items
- [ ] Implement rock → NFT token minting
- [ ] Add multiple resource types (wood, ore, gems)
- [ ] Create item rarity system

### Account Abstraction
- [ ] Integrate smart wallet (Account Abstraction)
- [ ] Gasless transactions for better UX
- [ ] Auto-mint items to player wallets

### Layer 2 Deployment
- [ ] Choose L2 chain (Arbitrum, Optimism, Polygon)
- [ ] Deploy game contracts
- [ ] Set up cross-chain compatibility

### Game Features
- [ ] Crafting system (combine resources)
- [ ] Trading marketplace
- [ ] Player levels and progression
- [ ] Multiplayer interactions

## Blockchain Integration Plan

1. **ERC-1155 Token Standard**: Perfect for stackable items like rocks, wood, etc.
2. **Smart Wallet Integration**: Use Account Abstraction for seamless user experience
3. **Low-Cost L2**: Deploy on Arbitrum or Polygon for cheap transactions
4. **MetaMask Integration**: Connect wallet functionality
5. **IPFS Metadata**: Store item metadata on IPFS for decentralization

## Development

The game uses modern TypeScript syntax and follows React best practices. The Phaser game is contained within a React component for easy integration with web3 libraries.

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## License

MIT
