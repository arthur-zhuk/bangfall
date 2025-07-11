import { useState, useEffect } from 'react'
import { useSmartWallet } from './SmartWalletProvider'
import { ethers } from 'ethers'
import { GameItemsABI, CONTRACT_ADDRESS } from '../contracts/GameItems'

interface Monster {
  name: string
  level: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  xpReward: number
  emoji: string
}

interface CombatState {
  playerHealth: number
  playerMaxHealth: number
  playerAttack: number
  playerDefense: number
  playerLevel: number
  monster: Monster | null
  isPlayerTurn: boolean
  combatLog: string[]
  isInCombat: boolean
  xpGained: number
}

const MONSTERS: Monster[] = [
  {
    name: 'Goblin',
    level: 1,
    health: 15,
    maxHealth: 15,
    attack: 3,
    defense: 1,
    xpReward: 20,
    emoji: '👹'
  },
  {
    name: 'Skeleton',
    level: 2,
    health: 25,
    maxHealth: 25,
    attack: 5,
    defense: 2,
    xpReward: 35,
    emoji: '💀'
  },
  {
    name: 'Orc',
    level: 3,
    health: 40,
    maxHealth: 40,
    attack: 8,
    defense: 3,
    xpReward: 50,
    emoji: '👺'
  }
]

interface CombatArenaProps {
  onClose: () => void
}

export default function CombatArena({ onClose }: CombatArenaProps) {
  const { isConnected, address } = useSmartWallet()
  const [combatState, setCombatState] = useState<CombatState>({
    playerHealth: 100,
    playerMaxHealth: 100,
    playerAttack: 10,
    playerDefense: 5,
    playerLevel: 1,
    monster: null,
    isPlayerTurn: true,
    combatLog: ['Welcome to the Combat Arena!'],
    isInCombat: false,
    xpGained: 0
  })
  const [autoCombat, setAutoCombat] = useState(false);
  const [lastPlayerChoice, setLastPlayerChoice] = useState<number>(0); // 0=attack, 1=defend, 2=trick

  useEffect(() => {
    // Initialize player stats from blockchain
    loadPlayerStats()
  }, [])

  const loadPlayerStats = async () => {
    if (!isConnected || !address) return

    try {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, GameItemsABI, provider)
      const stats = await contract.getPlayerStats(address)
      setCombatState(prev => ({
        ...prev,
        playerLevel: Number(stats.level),
        playerHealth: 50 + Number(stats.level) * 10,
        playerMaxHealth: 50 + Number(stats.level) * 10,
        playerAttack: 5 + Number(stats.level) * 2,
        playerDefense: 3 + Number(stats.level)
      }))
    } catch (error) {
      console.error('Failed to load player stats:', error)
    }
  }

  const addToCombatLog = (message: string) => {
    setCombatState(prev => ({
      ...prev,
      combatLog: [...prev.combatLog.slice(-4), message] // Keep last 5 messages
    }))
  }

  const selectMonster = (monster: Monster) => {
    const newMonster = { ...monster, health: monster.maxHealth }
    setCombatState(prev => ({
      ...prev,
      monster: newMonster,
      isInCombat: true,
      isPlayerTurn: true,
      xpGained: 0
    }))
    addToCombatLog(`A wild ${monster.emoji} ${monster.name} (Level ${monster.level}) appears!`)
  }

  const calculateDamage = (attack: number, defense: number): number => {
    const baseDamage = Math.max(1, attack - defense)
    const randomFactor = 0.8 + Math.random() * 0.4 // 80% to 120% of base damage
    return Math.floor(baseDamage * randomFactor)
  }

  const playerAttack = () => {
    setLastPlayerChoice(0);
    if (!combatState.monster || !combatState.isPlayerTurn) return

    const damage = calculateDamage(combatState.playerAttack, combatState.monster.defense)
    const newMonsterHealth = Math.max(0, combatState.monster.health - damage)

    addToCombatLog(`You deal ${damage} damage to the ${combatState.monster.name}!`)

    setCombatState(prev => ({
      ...prev,
      monster: prev.monster ? { ...prev.monster, health: newMonsterHealth } : null,
      isPlayerTurn: false
    }))

    // Check if monster is defeated
    if (newMonsterHealth <= 0) {
      setTimeout(() => {
        addToCombatLog(`${combatState.monster!.name} is defeated! You gain ${combatState.monster!.xpReward} combat XP!`)
        setCombatState(prev => ({
          ...prev,
          isInCombat: false,
          xpGained: prev.xpGained + (prev.monster?.xpReward || 0),
          monster: null
        }))
        
        // Award XP on blockchain
        awardCombatXP(combatState.monster!.xpReward)
      }, 1000)
    } else {
      // Monster's turn
      setTimeout(monsterAttack, 1500)
    }
  }

  const playerDefend = () => {
    setLastPlayerChoice(1);
    if (!combatState.monster || !combatState.isPlayerTurn) return

    addToCombatLog('You raise your guard and prepare to defend!')
    setCombatState(prev => ({
      ...prev,
      isPlayerTurn: false,
      playerDefense: prev.playerDefense + 3 // Temporary defense boost
    }))

    setTimeout(monsterAttack, 1500)
  }

  const playerTrick = () => {
    setLastPlayerChoice(2);
    if (!combatState.monster || !combatState.isPlayerTurn) return;
    addToCombatLog('You attempt to trick the enemy!');
    setCombatState(prev => ({ ...prev, isPlayerTurn: false }));
    setTimeout(monsterAttack, 1500);
  };

  // Modify monsterAttack to incorporate choices
  const monsterAttack = () => {
    if (!combatState.monster) return;
    const monsterChoice = Math.floor(Math.random() * 3);
    // Simple payoff: if player beats monster (rock-paper-scissors), double damage, else half
    const beats = (p: number, m: number) => (p === 0 && m === 2) || (p === 1 && m === 0) || (p === 2 && m === 1);
    const multiplier = beats(lastPlayerChoice, monsterChoice) ? 2 : 0.5;
    const damage = calculateDamage(combatState.monster.attack, combatState.playerDefense) * multiplier;
    const newMonsterHealth = Math.max(0, combatState.monster.health - damage)

    addToCombatLog(`${combatState.monster.name} ${monsterChoice === 0 ? 'attacks' : monsterChoice === 1 ? 'defends' : 'tricks'}! You ${lastPlayerChoice === 0 ? 'attack' : lastPlayerChoice === 1 ? 'defend' : 'trick'}!`)

    setCombatState(prev => ({
      ...prev,
      monster: prev.monster ? { ...prev.monster, health: newMonsterHealth } : null,
      isPlayerTurn: false
    }))

    // Check if monster is defeated
    if (newMonsterHealth <= 0) {
      setTimeout(() => {
        addToCombatLog(`${combatState.monster!.name} is defeated! You gain ${combatState.monster!.xpReward} combat XP!`)
        setCombatState(prev => ({
          ...prev,
          isInCombat: false,
          xpGained: prev.xpGained + (prev.monster?.xpReward || 0),
          monster: null
        }))
        
        // Award XP on blockchain
        awardCombatXP(combatState.monster!.xpReward)
      }, 1000)
    } else {
      // Monster's turn
      setTimeout(monsterAttack, 1500)
    }
  };

  const awardCombatXP = async (xp: number) => {
    if (!isConnected || !address) return

    try {
      // For now, we'll use item ID 4 (Gold Ore) to represent combat XP
      // In a full implementation, we'd expand the contract to have separate combat XP
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, GameItemsABI, provider)
      const tx = await contract.mine(address, 4, 1)
      await tx.wait()
      addToCombatLog('Combat XP awarded to your blockchain account!')
    } catch (error) {
      console.error('Failed to award combat XP:', error)
      addToCombatLog('Failed to award XP to blockchain, but you still gained local XP!')
    }
  }

  const heal = () => {
    const healAmount = Math.floor(combatState.playerMaxHealth * 0.3)
    const newHealth = Math.min(combatState.playerMaxHealth, combatState.playerHealth + healAmount)
    
    setCombatState(prev => ({
      ...prev,
      playerHealth: newHealth
    }))
    
    addToCombatLog(`You drink a healing potion and restore ${newHealth - combatState.playerHealth} health!`)
  }

  useEffect(() => {
    if (autoCombat && combatState.isInCombat && combatState.isPlayerTurn) {
      const actions = [playerAttack, playerDefend, playerTrick];
      const randomAction = actions[Math.floor(Math.random() * 3)];
      randomAction();
    }
  }, [autoCombat, combatState]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80%',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>⚔️ Combat Arena</h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Player Stats */}
        <div style={{ 
          backgroundColor: 'rgba(52, 152, 219, 0.2)', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          <h3>🛡️ Player Stats</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <strong>Level:</strong> {combatState.playerLevel}
            </div>
            <div>
              <strong>Health:</strong> {combatState.playerHealth}/{combatState.playerMaxHealth}
            </div>
            <div>
              <strong>Attack:</strong> {combatState.playerAttack}
            </div>
            <div>
              <strong>Defense:</strong> {combatState.playerDefense}
            </div>
          </div>
          <div style={{ 
            backgroundColor: '#e74c3c', 
            height: '10px', 
            borderRadius: '5px', 
            marginTop: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#2ecc71',
              height: '100%',
              width: `${(combatState.playerHealth / combatState.playerMaxHealth) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {!combatState.isInCombat ? (
          <div>
            <h3>Choose Your Opponent:</h3>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {MONSTERS.map((monster, index) => (
                <button
                  key={index}
                  onClick={() => selectMonster(monster)}
                  style={{
                    backgroundColor: '#34495e',
                    color: 'white',
                    border: 'none',
                    padding: '15px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    minWidth: '150px',
                    textAlign: 'center'
                  }}
                  disabled={combatState.playerHealth <= 0}
                >
                  <div style={{ fontSize: '30px', marginBottom: '5px' }}>{monster.emoji}</div>
                  <div><strong>{monster.name}</strong></div>
                  <div>Level {monster.level}</div>
                  <div>{monster.health} HP</div>
                  <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                    {monster.xpReward} XP
                  </div>
                </button>
              ))}
            </div>

            {combatState.playerHealth < combatState.playerMaxHealth && (
              <button
                onClick={heal}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
              >
                🧪 Heal (Restore 30% Health)
              </button>
            )}

            {combatState.xpGained > 0 && (
              <div style={{ 
                backgroundColor: 'rgba(46, 204, 113, 0.2)', 
                padding: '10px', 
                borderRadius: '5px',
                marginBottom: '20px'
              }}>
                <strong>🎉 Total XP Gained This Session: {combatState.xpGained}</strong>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Monster Display */}
            {combatState.monster && (
              <div style={{ 
                backgroundColor: 'rgba(231, 76, 60, 0.2)', 
                padding: '15px', 
                borderRadius: '5px', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>
                  {combatState.monster.emoji}
                </div>
                <h3>{combatState.monster.name} (Level {combatState.monster.level})</h3>
                <div style={{ marginBottom: '10px' }}>
                  Health: {combatState.monster.health}/{combatState.monster.maxHealth}
                </div>
                <div style={{ 
                  backgroundColor: '#e74c3c', 
                  height: '10px', 
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    backgroundColor: '#f39c12',
                    height: '100%',
                    width: `${(combatState.monster.health / combatState.monster.maxHealth) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Combat Actions */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
              <button
                onClick={playerAttack}
                disabled={!combatState.isPlayerTurn || combatState.playerHealth <= 0}
                style={{
                  backgroundColor: combatState.isPlayerTurn ? '#e74c3c' : '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '5px',
                  cursor: combatState.isPlayerTurn ? 'pointer' : 'not-allowed',
                  fontSize: '16px'
                }}
              >
                ⚔️ Attack
              </button>
              <button
                onClick={playerDefend}
                disabled={!combatState.isPlayerTurn || combatState.playerHealth <= 0}
                style={{
                  backgroundColor: combatState.isPlayerTurn ? '#3498db' : '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '5px',
                  cursor: combatState.isPlayerTurn ? 'pointer' : 'not-allowed',
                  fontSize: '16px'
                }}
              >
                🛡️ Defend
              </button>
              <button onClick={playerTrick} disabled={!combatState.isPlayerTurn}>🃏 Trick</button>
            </div>

            <button onClick={() => setAutoCombat(!autoCombat)}>{autoCombat ? 'Stop Auto' : 'Auto Combat'}</button>

            {!combatState.isPlayerTurn && combatState.monster && combatState.monster.health > 0 && (
              <div style={{ textAlign: 'center', color: '#f39c12', marginBottom: '20px' }}>
                <strong>{combatState.monster.name} is preparing to attack...</strong>
              </div>
            )}
          </div>
        )}

        {/* Combat Log */}
        <div style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          padding: '15px', 
          borderRadius: '5px',
          height: '150px',
          overflowY: 'auto'
        }}>
          <h4>Combat Log:</h4>
          {combatState.combatLog.map((message, index) => (
            <div key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>
              {message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 