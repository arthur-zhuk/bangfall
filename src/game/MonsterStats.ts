export interface MonsterStats {
  id: string
  name: string
  type: MonsterType
  level: number
  
  // Core stats
  maxHP: number
  currentHP: number
  attack: number
  defense: number
  
  // Combat behavior
  accuracy: number
  critChance: number
  abilities: MonsterAbility[]
  
  // Rewards
  xpReward: number
  goldReward: number
  itemDrops: ItemDrop[]
  
  // Visual
  emoji: string
  color: string
  size: number
  
  // Scaling
  difficultyMultiplier: number
}

export const MonsterType = {
  GOBLIN: 'goblin',
  ORC: 'orc',
  SKELETON: 'skeleton',
  DRAGON: 'dragon',
  SLIME: 'slime',
  WOLF: 'wolf',
  SPIDER: 'spider',
  TROLL: 'troll'
} as const

export type MonsterType = typeof MonsterType[keyof typeof MonsterType]

export interface MonsterAbility {
  name: string
  description: string
  damage: number
  cooldown: number
  effect?: AbilityEffect
}

export interface AbilityEffect {
  type: 'poison' | 'stun' | 'heal' | 'buff' | 'debuff'
  duration: number
  value: number
}



export interface ItemDrop {
  itemId: number
  itemName: string
  dropChance: number
  minQuantity: number
  maxQuantity: number
}

export class MonsterStatsGenerator {
  private static readonly BASE_STATS = {
    [MonsterType.GOBLIN]: {
      name: 'Goblin',
      emoji: '👺',
      color: '#4a5d23',
      baseHP: 30,
      baseAttack: 8,
      baseDefense: 2,
      baseXP: 15,
      baseGold: 5,
      size: 1.0,
      abilities: [
        { name: 'Slash', description: 'A basic melee attack', damage: 1.0, cooldown: 0 },
        { name: 'Fury', description: 'Increases attack for 3 turns', damage: 0.8, cooldown: 5, effect: { type: 'buff' as const, duration: 3, value: 1.5 } }
      ]
    },
    [MonsterType.ORC]: {
      name: 'Orc',
      emoji: '🧌',
      color: '#2d5016',
      baseHP: 60,
      baseAttack: 12,
      baseDefense: 4,
      baseXP: 25,
      baseGold: 10,
      size: 1.2,
      abilities: [
        { name: 'Smash', description: 'A powerful overhead strike', damage: 1.3, cooldown: 0 },
        { name: 'Intimidate', description: 'Reduces player attack for 2 turns', damage: 0.5, cooldown: 4, effect: { type: 'debuff', duration: 2, value: 0.7 } }
      ]
    },
    [MonsterType.SKELETON]: {
      name: 'Skeleton',
      emoji: '💀',
      color: '#f4f4f4',
      baseHP: 40,
      baseAttack: 10,
      baseDefense: 6,
      baseXP: 20,
      baseGold: 8,
      size: 1.0,
      abilities: [
        { name: 'Bone Throw', description: 'Throws a bone projectile', damage: 1.1, cooldown: 0 },
        { name: 'Death Rattle', description: 'Causes fear, stunning for 1 turn', damage: 0.6, cooldown: 6, effect: { type: 'stun', duration: 1, value: 1 } }
      ]
    },
    [MonsterType.DRAGON]: {
      name: 'Dragon',
      emoji: '🐉',
      color: '#8b0000',
      baseHP: 200,
      baseAttack: 25,
      baseDefense: 15,
      baseXP: 100,
      baseGold: 50,
      size: 2.0,
      abilities: [
        { name: 'Claw', description: 'A devastating claw attack', damage: 1.0, cooldown: 0 },
        { name: 'Fire Breath', description: 'Burns the enemy for 3 turns', damage: 1.5, cooldown: 4, effect: { type: 'poison', duration: 3, value: 8 } },
        { name: 'Wing Buffet', description: 'Knocks back and stuns for 1 turn', damage: 0.8, cooldown: 5, effect: { type: 'stun', duration: 1, value: 1 } }
      ]
    },
    [MonsterType.SLIME]: {
      name: 'Slime',
      emoji: '🟢',
      color: '#32cd32',
      baseHP: 25,
      baseAttack: 6,
      baseDefense: 1,
      baseXP: 10,
      baseGold: 3,
      size: 0.8,
      abilities: [
        { name: 'Absorb', description: 'Absorbs damage and heals', damage: 0.7, cooldown: 0, effect: { type: 'heal', duration: 1, value: 5 } },
        { name: 'Split', description: 'Splits when health is low', damage: 0.5, cooldown: 8 }
      ]
    },
    [MonsterType.WOLF]: {
      name: 'Wolf',
      emoji: '🐺',
      color: '#696969',
      baseHP: 45,
      baseAttack: 14,
      baseDefense: 3,
      baseXP: 18,
      baseGold: 6,
      size: 1.1,
      abilities: [
        { name: 'Bite', description: 'A quick bite attack', damage: 1.0, cooldown: 0 },
        { name: 'Howl', description: 'Increases attack and accuracy', damage: 0.3, cooldown: 6, effect: { type: 'buff', duration: 4, value: 1.3 } }
      ]
    },
    [MonsterType.SPIDER]: {
      name: 'Spider',
      emoji: '🕷️',
      color: '#2f1b14',
      baseHP: 35,
      baseAttack: 11,
      baseDefense: 2,
      baseXP: 16,
      baseGold: 4,
      size: 0.9,
      abilities: [
        { name: 'Venomous Bite', description: 'Poisons the enemy', damage: 0.8, cooldown: 0, effect: { type: 'poison', duration: 4, value: 3 } },
        { name: 'Web Shot', description: 'Stuns the enemy for 2 turns', damage: 0.4, cooldown: 5, effect: { type: 'stun', duration: 2, value: 1 } }
      ]
    },
    [MonsterType.TROLL]: {
      name: 'Troll',
      emoji: '🧟',
      color: '#556b2f',
      baseHP: 120,
      baseAttack: 18,
      baseDefense: 8,
      baseXP: 45,
      baseGold: 20,
      size: 1.5,
      abilities: [
        { name: 'Club Smash', description: 'A heavy club attack', damage: 1.2, cooldown: 0 },
        { name: 'Regenerate', description: 'Heals over time', damage: 0, cooldown: 7, effect: { type: 'heal', duration: 3, value: 15 } },
        { name: 'Berserker Rage', description: 'Increases attack but reduces defense', damage: 1.5, cooldown: 8, effect: { type: 'buff', duration: 5, value: 1.8 } }
      ]
    }
  }
  
  private static readonly ITEM_DROPS = {
    [MonsterType.GOBLIN]: [
      { itemId: 11, itemName: 'Sword', dropChance: 0.1, minQuantity: 1, maxQuantity: 1 },
      { itemId: 14, itemName: 'Health Potion', dropChance: 0.3, minQuantity: 1, maxQuantity: 2 },
      { itemId: 1, itemName: 'Rock', dropChance: 0.6, minQuantity: 1, maxQuantity: 3 }
    ],
    [MonsterType.ORC]: [
      { itemId: 11, itemName: 'Sword', dropChance: 0.15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 12, itemName: 'Shield', dropChance: 0.12, minQuantity: 1, maxQuantity: 1 },
      { itemId: 14, itemName: 'Health Potion', dropChance: 0.4, minQuantity: 1, maxQuantity: 2 },
      { itemId: 4, itemName: 'Gold Ore', dropChance: 0.2, minQuantity: 1, maxQuantity: 2 }
    ],
    [MonsterType.SKELETON]: [
      { itemId: 13, itemName: 'Armor', dropChance: 0.08, minQuantity: 1, maxQuantity: 1 },
      { itemId: 15, itemName: 'Magic Scroll', dropChance: 0.15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 14, itemName: 'Health Potion', dropChance: 0.35, minQuantity: 1, maxQuantity: 2 }
    ],
    [MonsterType.DRAGON]: [
      { itemId: 5, itemName: 'Diamond', dropChance: 0.8, minQuantity: 1, maxQuantity: 3 },
      { itemId: 6, itemName: 'Emerald', dropChance: 0.6, minQuantity: 1, maxQuantity: 2 },
      { itemId: 13, itemName: 'Armor', dropChance: 0.4, minQuantity: 1, maxQuantity: 1 },
      { itemId: 15, itemName: 'Magic Scroll', dropChance: 0.5, minQuantity: 1, maxQuantity: 2 }
    ],
    [MonsterType.SLIME]: [
      { itemId: 14, itemName: 'Health Potion', dropChance: 0.5, minQuantity: 1, maxQuantity: 1 },
      { itemId: 15, itemName: 'Magic Scroll', dropChance: 0.2, minQuantity: 1, maxQuantity: 1 }
    ],
    [MonsterType.WOLF]: [
      { itemId: 7, itemName: 'Raw Fish', dropChance: 0.4, minQuantity: 1, maxQuantity: 2 },
      { itemId: 14, itemName: 'Health Potion', dropChance: 0.3, minQuantity: 1, maxQuantity: 1 },
      { itemId: 2, itemName: 'Wood', dropChance: 0.5, minQuantity: 1, maxQuantity: 3 }
    ],
    [MonsterType.SPIDER]: [
      { itemId: 15, itemName: 'Magic Scroll', dropChance: 0.25, minQuantity: 1, maxQuantity: 1 },
      { itemId: 14, itemName: 'Health Potion', dropChance: 0.2, minQuantity: 1, maxQuantity: 1 },
      { itemId: 2, itemName: 'Wood', dropChance: 0.4, minQuantity: 1, maxQuantity: 2 }
    ],
    [MonsterType.TROLL]: [
      { itemId: 11, itemName: 'Sword', dropChance: 0.2, minQuantity: 1, maxQuantity: 1 },
      { itemId: 12, itemName: 'Shield', dropChance: 0.18, minQuantity: 1, maxQuantity: 1 },
      { itemId: 13, itemName: 'Armor', dropChance: 0.15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 4, itemName: 'Gold Ore', dropChance: 0.3, minQuantity: 1, maxQuantity: 3 },
      { itemId: 14, itemName: 'Health Potion', dropChance: 0.6, minQuantity: 2, maxQuantity: 4 }
    ]
  }
  
  public static generateMonster(type: MonsterType, level: number, difficultyMultiplier: number = 1.0): MonsterStats {
    const baseStats = this.BASE_STATS[type]
    const levelMultiplier = 1 + (level - 1) * 0.3
    const finalMultiplier = levelMultiplier * difficultyMultiplier
    
    // Calculate scaled stats
    const maxHP = Math.floor(baseStats.baseHP * finalMultiplier)
    const attack = Math.floor(baseStats.baseAttack * finalMultiplier)
    const defense = Math.floor(baseStats.baseDefense * finalMultiplier)
    const xpReward = Math.floor(baseStats.baseXP * finalMultiplier)
    const goldReward = Math.floor(baseStats.baseGold * finalMultiplier)
    
    // Generate level-appropriate abilities
    const abilities = this.generateAbilities(baseStats.abilities, level)
    
    // Generate item drops
    const itemDrops = this.generateItemDrops(type, level)
    
    return {
      id: `${type}_${level}_${Date.now()}`,
      name: `${baseStats.name} (Level ${level})`,
      type,
      level,
      maxHP,
      currentHP: maxHP,
      attack,
      defense,
      accuracy: Math.min(0.95, 0.7 + (level * 0.02)),
      critChance: Math.min(0.3, 0.05 + (level * 0.01)),
      abilities,
      xpReward,
      goldReward,
      itemDrops,
      emoji: baseStats.emoji,
      color: baseStats.color,
      size: baseStats.size,
      difficultyMultiplier
    }
  }
  
  private static generateAbilities(baseAbilities: any[], level: number): MonsterAbility[] {
    return baseAbilities.map(ability => ({
      name: ability.name,
      description: ability.description,
      damage: ability.damage * (1 + (level - 1) * 0.1),
      cooldown: Math.max(1, ability.cooldown - Math.floor(level / 5)),
      effect: ability.effect
    }))
  }
  
  private static generateItemDrops(type: MonsterType, level: number): ItemDrop[] {
    const baseDrops = this.ITEM_DROPS[type] || []
    
    return baseDrops.map(drop => ({
      ...drop,
      dropChance: Math.min(0.8, drop.dropChance * (1 + (level - 1) * 0.02)),
      maxQuantity: drop.maxQuantity + Math.floor(level / 3)
    }))
  }
  
  public static getRandomMonsterType(playerLevel: number): MonsterType {
    const availableTypes = this.getAvailableMonsterTypes(playerLevel)
    return availableTypes[Math.floor(Math.random() * availableTypes.length)]
  }
  
  private static getAvailableMonsterTypes(playerLevel: number): MonsterType[] {
    if (playerLevel >= 20) return Object.values(MonsterType)
    if (playerLevel >= 15) return [MonsterType.GOBLIN, MonsterType.ORC, MonsterType.SKELETON, MonsterType.WOLF, MonsterType.SPIDER, MonsterType.TROLL]
    if (playerLevel >= 10) return [MonsterType.GOBLIN, MonsterType.ORC, MonsterType.SKELETON, MonsterType.WOLF, MonsterType.SPIDER]
    if (playerLevel >= 5) return [MonsterType.GOBLIN, MonsterType.ORC, MonsterType.SLIME, MonsterType.WOLF]
    return [MonsterType.GOBLIN, MonsterType.SLIME]
  }
  
  public static generateRandomMonster(playerLevel: number, difficultyMultiplier: number = 1.0): MonsterStats {
    const type = this.getRandomMonsterType(playerLevel)
    const monsterLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1)
    return this.generateMonster(type, monsterLevel, difficultyMultiplier)
  }
  
  public static getMonsterDifficultyRating(monster: MonsterStats): number {
    return monster.attack + monster.defense + Math.floor(monster.maxHP / 10) + (monster.level * 2)
  }
  
  public static getRecommendedPlayerLevel(monster: MonsterStats): number {
    const difficulty = this.getMonsterDifficultyRating(monster)
    return Math.max(1, Math.floor(difficulty / 8))
  }
} 