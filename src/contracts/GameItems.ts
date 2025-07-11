import { ethers } from 'ethers'

// Contract ABI - Enhanced for multiple skills and 3D gameplay
export const GameItemsABI = [
  // View functions
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function getPlayerStats(address player) view returns (tuple(uint256 level, uint256 totalXP, uint256 miningXP, uint256 fishingXP, uint256 cookingXP, uint256 combatXP, uint256 craftingXP, uint256 magicXP, uint256 health, uint256 maxHealth, uint256 combatWins, uint256 combatLosses, uint256 gameVersion, uint256 lastActivity))",
  "function getPlayerInventory(address player) view returns (uint256[] ids, uint256[] balances, string[] names)",
  "function getItemInfo(uint256 itemId) view returns (tuple(string name, string description, uint256 category, uint256 rarity, uint256 value, bool tradeable))",
  "function getSkillLevel(address player, uint8 skill) view returns (uint256)",
  "function getActivityConfig(uint8 skill) view returns (tuple(uint256 baseXP, uint256 baseTime, uint256 requiredLevel, uint256[] possibleItems, uint256[] itemChances))",
  "function authorizedMiners(address) view returns (bool)",
  "function owner() view returns (address)",
  
  // Activity functions
  "function mine(address player, uint256 itemId, uint256 amount)",
  "function performActivity(address player, uint8 skill, uint256 amount)",
  "function recordCombatResult(address player, bool victory, uint256 xpGained)",
  "function craftItem(uint256 recipeId, uint256 amount)",
  
  // Admin functions
  "function authorizeMiner(address miner)",
  "function revokeMiner(address miner)",
  "function setItemInfo(uint256 itemId, tuple(string name, string description, uint256 category, uint256 rarity, uint256 value, bool tradeable) info)",
  "function pause()",
  "function unpause()",
  "function emergencyMint(address to, uint256 itemId, uint256 amount)",
  
  // Events
  "event PlayerRegistered(address indexed player)",
  "event ActivityCompleted(address indexed player, uint8 skill, uint256 xpGained, uint256 itemId, uint256 amount)",
  "event LevelUp(address indexed player, uint8 skill, uint256 newLevel)",
  "event CombatResult(address indexed player, bool victory, uint256 xpGained)",
  "event ItemCrafted(address indexed player, uint256 itemId, uint256 amount)"
]

export const CONTRACT_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F"

export interface ItemInfo {
  name: string
  description: string
  rarity: number
  xpPerItem: number
  minLevel: number
  exists: boolean
  isActive: boolean
}

export interface PlayerStats {
  level: number
  xp: number
  totalItemTypes: number
  gameVersion: number
}

export interface PlayerInventory {
  itemIds: number[]
  balances: number[]
  names: string[]
}

export interface GameItem {
  id: number
  name: string
  rarity: number
  xpPerItem: number
  minLevel: number
  isActive: boolean
}

export const getRarityName = (rarity: number): string => {
  switch (rarity) {
    case 1: return "Common"
    case 2: return "Uncommon"
    case 3: return "Rare"
    case 4: return "Epic"
    case 5: return "Legendary"
    default: return "Unknown"
  }
}

export const getRarityColor = (rarity: number): string => {
  switch (rarity) {
    case 1: return "#ffffff" // White
    case 2: return "#00ff00" // Green
    case 3: return "#0080ff" // Blue
    case 4: return "#8000ff" // Purple
    case 5: return "#ff8000" // Orange
    default: return "#ffffff"
  }
}

// Helper functions
export const mineItems = async (
  contract: ethers.Contract,
  player: string,
  itemId: number,
  amount: number
): Promise<ethers.TransactionResponse> => {
  return contract.mine(player, itemId, amount)
}

export const batchMineItems = async (
  contract: ethers.Contract,
  player: string,
  itemIds: number[],
  amounts: number[]
): Promise<ethers.TransactionResponse> => {
  return contract.batchMine(player, itemIds, amounts)
}

export const getPlayerStats = async (
  contract: ethers.Contract,
  player: string
): Promise<PlayerStats> => {
  const stats = await contract.getPlayerStats(player)
  return {
    level: Number(stats.level),
    xp: Number(stats.xp),
    totalItemTypes: Number(stats.totalItemTypes),
    gameVersion: Number(stats.gameVer)
  }
}

export const getPlayerInventory = async (
  contract: ethers.Contract,
  player: string
): Promise<PlayerInventory> => {
  const inventory = await contract.getPlayerInventory(player)
  return {
    itemIds: inventory.itemIds.map((id: any) => Number(id)),
    balances: inventory.balances.map((balance: any) => Number(balance)),
    names: inventory.names
  }
}

export const getAllItems = async (
  contract: ethers.Contract
): Promise<GameItem[]> => {
  const items = await contract.getAllItems()
  return items.itemIds.map((id: any, index: number) => ({
    id: Number(id),
    name: items.names[index],
    rarity: Number(items.rarities[index]),
    xpPerItem: Number(items.xpValues[index]),
    minLevel: Number(items.minLevels[index]),
    isActive: items.activeStatus[index]
  }))
}

export const getItemInfo = async (
  contract: ethers.Contract,
  itemId: number
): Promise<ItemInfo> => {
  const item = await contract.getItemInfo(itemId)
  return {
    name: item.name,
    description: item.description,
    rarity: Number(item.rarity),
    xpPerItem: Number(item.xpPerItem),
    minLevel: Number(item.minLevel),
    exists: item.exists,
    isActive: item.isActive
  }
}

// Admin functions
export const addItem = async (
  contract: ethers.Contract,
  name: string,
  description: string,
  rarity: number,
  xpPerItem: number,
  minLevel: number,
  isActive: boolean
): Promise<ethers.TransactionResponse> => {
  return contract.addItem(name, description, rarity, xpPerItem, minLevel, isActive)
}

export const addDragonContent = async (
  contract: ethers.Contract
): Promise<ethers.TransactionResponse> => {
  return contract.addDragonContent()
}

export const addCelestialContent = async (
  contract: ethers.Contract
): Promise<ethers.TransactionResponse> => {
  return contract.addCelestialContent()
} 