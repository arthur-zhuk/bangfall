export interface PlayerStats {
  // Core stats
  level: number
  totalXP: number
  currentHP: number
  maxHP: number
  attack: number
  defense: number
  
  // Skill XP
  miningXP: number
  fishingXP: number
  cookingXP: number
  combatXP: number
  craftingXP: number
  magicXP: number
  
  // Skill levels
  miningLevel: number
  fishingLevel: number
  cookingLevel: number
  combatLevel: number
  craftingLevel: number
  magicLevel: number
  
  // Combat stats
  combatWins: number
  combatLosses: number
  
  // Progression
  xpToNextLevel: number
  skillPoints: number
}

export interface LevelUpResult {
  newLevel: number
  statIncreases: {
    hp: number
    attack: number
    defense: number
  }
  skillPointsGained: number
}

export class PlayerStatsManager {
  private stats: PlayerStats
  private listeners: ((stats: PlayerStats) => void)[] = []
  
  constructor(initialStats?: Partial<PlayerStats>) {
    this.stats = {
      level: 1,
      totalXP: 0,
      currentHP: 100,
      maxHP: 100,
      attack: 10,
      defense: 5,
      
      miningXP: 0,
      fishingXP: 0,
      cookingXP: 0,
      combatXP: 0,
      craftingXP: 0,
      magicXP: 0,
      
      miningLevel: 1,
      fishingLevel: 1,
      cookingLevel: 1,
      combatLevel: 1,
      craftingLevel: 1,
      magicLevel: 1,
      
      combatWins: 0,
      combatLosses: 0,
      
      xpToNextLevel: 0,
      skillPoints: 0,
      
      ...initialStats
    }
    
    this.updateDerivedStats()
  }
  
  // XP calculation formulas
  private getXPRequiredForLevel(level: number): number {
    // Exponential growth: level² * 100 + level * 50
    return Math.floor(level * level * 100 + level * 50)
  }
  
  private getSkillLevelFromXP(xp: number): number {
    // Skill levels: √(XP/100) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }
  
  private getOverallLevelFromTotalXP(totalXP: number): number {
    // Overall level based on total XP across all skills
    let level = 1
    let requiredXP = 0
    
    while (requiredXP <= totalXP) {
      level++
      requiredXP = this.getXPRequiredForLevel(level)
    }
    
    return level - 1
  }
  
  // Stat calculations based on levels
  private calculateMaxHP(): number {
    return 50 + (this.stats.level * 20) + (this.stats.combatLevel * 5)
  }
  
  private calculateAttack(): number {
    return 5 + (this.stats.level * 2) + (this.stats.combatLevel * 3)
  }
  
  private calculateDefense(): number {
    return 2 + (this.stats.level * 1) + (this.stats.combatLevel * 2)
  }
  
  private updateDerivedStats() {
    // Update skill levels from XP
    this.stats.miningLevel = this.getSkillLevelFromXP(this.stats.miningXP)
    this.stats.fishingLevel = this.getSkillLevelFromXP(this.stats.fishingXP)
    this.stats.cookingLevel = this.getSkillLevelFromXP(this.stats.cookingXP)
    this.stats.combatLevel = this.getSkillLevelFromXP(this.stats.combatXP)
    this.stats.craftingLevel = this.getSkillLevelFromXP(this.stats.craftingXP)
    this.stats.magicLevel = this.getSkillLevelFromXP(this.stats.magicXP)
    
    // Calculate total XP
    this.stats.totalXP = this.stats.miningXP + this.stats.fishingXP + this.stats.cookingXP + 
                        this.stats.combatXP + this.stats.craftingXP + this.stats.magicXP
    
    // Update overall level
    const oldLevel = this.stats.level
    this.stats.level = this.getOverallLevelFromTotalXP(this.stats.totalXP)
    
    // Update combat stats
    const oldMaxHP = this.stats.maxHP
    this.stats.maxHP = this.calculateMaxHP()
    this.stats.attack = this.calculateAttack()
    this.stats.defense = this.calculateDefense()
    
    // Heal player if max HP increased
    if (this.stats.maxHP > oldMaxHP) {
      this.stats.currentHP = Math.min(this.stats.maxHP, this.stats.currentHP + (this.stats.maxHP - oldMaxHP))
    }
    
    // Calculate XP to next level
    const xpForNextLevel = this.getXPRequiredForLevel(this.stats.level + 1)
    this.stats.xpToNextLevel = xpForNextLevel - this.stats.totalXP
    
    // Check for level up
    if (this.stats.level > oldLevel) {
      this.handleLevelUp(oldLevel, this.stats.level)
    }
  }
  
  private handleLevelUp(oldLevel: number, newLevel: number): LevelUpResult {
    const levelDiff = newLevel - oldLevel
    const statIncreases = {
      hp: levelDiff * 20,
      attack: levelDiff * 2,
      defense: levelDiff * 1
    }
    
    const skillPointsGained = levelDiff * 2
    this.stats.skillPoints += skillPointsGained
    
    // Notify listeners
    this.notifyListeners()
    
    return {
      newLevel,
      statIncreases,
      skillPointsGained
    }
  }
  
  // Public methods
  public getStats(): PlayerStats {
    return { ...this.stats }
  }
  
  public addXP(skill: keyof Pick<PlayerStats, 'miningXP' | 'fishingXP' | 'cookingXP' | 'combatXP' | 'craftingXP' | 'magicXP'>, amount: number): LevelUpResult | null {
    const oldLevel = this.stats.level
    const oldSkillLevel = this.getSkillLevelFromXP(this.stats[skill])
    
    this.stats[skill] += amount
    this.updateDerivedStats()
    
    const newSkillLevel = this.getSkillLevelFromXP(this.stats[skill])
    
    // Check if overall level increased
    if (this.stats.level > oldLevel) {
      return this.handleLevelUp(oldLevel, this.stats.level)
    }
    
    // Check if skill level increased
    if (newSkillLevel > oldSkillLevel) {
      this.notifyListeners()
    }
    
    return null
  }
  
  public takeDamage(amount: number): boolean {
    this.stats.currentHP = Math.max(0, this.stats.currentHP - amount)
    this.notifyListeners()
    return this.stats.currentHP > 0
  }
  
  public heal(amount: number) {
    this.stats.currentHP = Math.min(this.stats.maxHP, this.stats.currentHP + amount)
    this.notifyListeners()
  }
  
  public recordCombatResult(victory: boolean, xpGained: number = 0) {
    if (victory) {
      this.stats.combatWins++
      if (xpGained > 0) {
        this.addXP('combatXP', xpGained)
      }
    } else {
      this.stats.combatLosses++
    }
    this.notifyListeners()
  }
  
  public resetHP() {
    this.stats.currentHP = this.stats.maxHP
    this.notifyListeners()
  }
  
  public addStatsListener(listener: (stats: PlayerStats) => void) {
    this.listeners.push(listener)
  }
  
  public removeStatsListener(listener: (stats: PlayerStats) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.stats))
  }
  
  // Utility methods
  public getSkillProgress(skill: keyof Pick<PlayerStats, 'miningXP' | 'fishingXP' | 'cookingXP' | 'combatXP' | 'craftingXP' | 'magicXP'>): { level: number, xp: number, xpToNext: number, progress: number } {
    const xp = this.stats[skill]
    const level = this.getSkillLevelFromXP(xp)
    const xpForCurrentLevel = (level - 1) * (level - 1) * 100
    const xpForNextLevel = level * level * 100
    const xpToNext = xpForNextLevel - xp
    const progress = (xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)
    
    return { level, xp, xpToNext, progress }
  }
  
  public getCombatRating(): number {
    return this.stats.attack + this.stats.defense + Math.floor(this.stats.maxHP / 10)
  }
  
  public save(): string {
    return JSON.stringify(this.stats)
  }
  
  public load(data: string) {
    try {
      const loadedStats = JSON.parse(data)
      this.stats = { ...this.stats, ...loadedStats }
      this.updateDerivedStats()
    } catch (error) {
      console.error('Failed to load player stats:', error)
    }
  }
} 