import React, { useRef, useEffect, useState } from 'react';
import { PhaserGame, type IRefPhaserGame } from '../game/PhaserGame';
import { EventBus } from '../game/EventBus';
import { NFTInventory } from './NFTInventory';
import { LevelUpNotification } from './LevelUpNotification';
import { MultiplayerUI } from './MultiplayerUI';
import { PvPCombatUI } from './PvPCombatUI';
import { PlayerStatsManager, type PlayerStats, type LevelUpResult } from '../game/PlayerStats';
import { MultiplayerManager } from '../multiplayer/MultiplayerManager';

export const LumbridgeGame = () => {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const [currentScene, setCurrentScene] = useState<Phaser.Scene | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  const [statsManager] = useState(() => new PlayerStatsManager());
  const [multiplayerManager] = useState(() => new MultiplayerManager());

  useEffect(() => {
    // Initialize player stats
    setPlayerStats(statsManager.getStats());
    
    // Make multiplayer manager available globally
    (window as any).multiplayerManager = multiplayerManager;
    
    // Auto-connect to multiplayer server with random username
    const autoConnectMultiplayer = async () => {
      // Check if already connected to avoid duplicate connections
      if (multiplayerManager.isConnected()) {
        console.log('🔄 Already connected to multiplayer server');
        return;
      }
      
      try {
        console.log('🔄 Auto-connecting to multiplayer server...');
        await multiplayerManager.connect();
        const randomUsername = `Player_${Math.floor(Math.random() * 1000)}`;
        multiplayerManager.joinGame(randomUsername);
        console.log('✅ Auto-connected to multiplayer as:', randomUsername);
      } catch (error) {
        console.log('❌ Auto-connection failed (this is ok if server is not running):', error);
      }
    };
    
    // Auto-connect after a short delay, but only once
    const connectTimeout = setTimeout(autoConnectMultiplayer, 2000);
    
    // Listen for stats changes
    const updateStats = (stats: PlayerStats) => {
      setPlayerStats(stats);
    };
    statsManager.addStatsListener(updateStats);

    // Listen for item obtained events from activities
    EventBus.on('item-obtained', (data: { itemId: number; itemName: string; activity: string }) => {
      console.log('Item obtained:', data);
      
      // Award XP based on activity
      let xpGained = 10;
      let skillType: 'miningXP' | 'fishingXP' | 'cookingXP' | 'combatXP' | 'craftingXP' | 'magicXP' = 'miningXP';
      
      switch (data.activity) {
        case 'mining':
          skillType = 'miningXP';
          xpGained = 15;
          break;
        case 'fishing':
          skillType = 'fishingXP';
          xpGained = 12;
          break;
        case 'cooking':
          skillType = 'cookingXP';
          xpGained = 18;
          break;
        case 'combat':
          skillType = 'combatXP';
          xpGained = 25;
          break;
        case 'crafting':
          skillType = 'craftingXP';
          xpGained = 20;
          break;
        case 'magic':
          skillType = 'magicXP';
          xpGained = 30;
          break;
      }
      
      const levelUpResult = statsManager.addXP(skillType, xpGained);
      if (levelUpResult) {
        setLevelUpResult(levelUpResult);
      }
      
      // Forward to Smart Wallet system
      window.dispatchEvent(new CustomEvent('smartWalletItemEarned', {
        detail: {
          itemId: data.itemId,
          itemName: data.itemName,
          quantity: 1
        }
      }));
    });

    // Listen for loot awarded events
    EventBus.on('loot-awarded', (data: { itemId: number; name: string }) => {
      console.log('Loot awarded:', data);
      
      // Award combat XP for defeating monsters
      const levelUpResult = statsManager.addXP('combatXP', 20);
      if (levelUpResult) {
        setLevelUpResult(levelUpResult);
      }
      
      // Forward to Smart Wallet system
      window.dispatchEvent(new CustomEvent('smartWalletItemEarned', {
        detail: {
          itemId: data.itemId,
          itemName: data.name,
          quantity: 1
        }
      }));
    });

    return () => {
      // Clear the connection timeout
      clearTimeout(connectTimeout);
      
      EventBus.removeAllListeners();
      statsManager.removeStatsListener(updateStats);
    };
  }, [statsManager, multiplayerManager]); // Add multiplayerManager to dependencies

  const onCurrentActiveScene = (scene: Phaser.Scene) => {
    setCurrentScene(scene);
    // Pass the stats manager to the scene when it's ready
    if (scene && 'setStatsManager' in scene) {
      (scene as any).setStatsManager(statsManager);
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex',
      backgroundColor: '#1a1a1a'
    }}>
      {/* Game Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
      </div>

      {/* Right Sidebar */}
      <div style={{ 
        width: '400px', 
        height: '100%',
        backgroundColor: '#2a2a2a',
        borderLeft: '2px solid #444',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Player Stats */}
        <div style={{ 
          flex: '0 0 auto', 
          padding: '15px',
          backgroundColor: '#333',
          borderBottom: '1px solid #555'
        }}>
          <h3 style={{ color: '#fff', margin: '0 0 10px 0' }}>Player Stats</h3>
          <div style={{ color: '#ccc', fontSize: '14px' }}>
            <div>Health: {playerStats?.currentHP || 100}/{playerStats?.maxHP || 100}</div>
            <div>Attack: {playerStats?.attack || 10}</div>
            <div>Defense: {playerStats?.defense || 5}</div>
            <div>Level: {playerStats?.level || 1}</div>
            <div>Total XP: {playerStats?.totalXP || 0}</div>
            <div>Skill Points: {playerStats?.skillPoints || 0}</div>
          </div>
          
          {/* Health Bar */}
          <div style={{ 
            marginTop: '10px',
            backgroundColor: '#555',
            borderRadius: '5px',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#e74c3c',
              height: '100%',
              width: `${((playerStats?.currentHP || 100) / (playerStats?.maxHP || 100)) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          {/* XP Progress Bar */}
          <div style={{ 
            marginTop: '8px',
            backgroundColor: '#555',
            borderRadius: '5px',
            height: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#3498db',
              height: '100%',
              width: `${Math.max(0, 100 - ((playerStats?.xpToNextLevel || 1) / 100) * 100)}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            XP to next level: {playerStats?.xpToNextLevel || 0}
          </div>
        </div>

        {/* Game Controls */}
        <div style={{ 
          flex: '0 0 auto', 
          padding: '15px',
          backgroundColor: '#333',
          borderBottom: '1px solid #555'
        }}>
          <h3 style={{ color: '#fff', margin: '0 0 10px 0' }}>Controls</h3>
          <div style={{ color: '#ccc', fontSize: '12px', lineHeight: '1.4' }}>
            <div>• Click anywhere to move</div>
            <div>• Click on colored areas to perform activities</div>
            <div>• Click on goblins to start combat</div>
            <div>• Use combat buttons during fights</div>
          </div>
        </div>
        
        {/* Inventory */}
        <div style={{ flex: 1, padding: '10px', overflow: 'hidden' }}>
          <NFTInventory />
        </div>
      </div>
      
      {/* Level Up Notification */}
      <LevelUpNotification 
        levelUpResult={levelUpResult} 
        onClose={() => setLevelUpResult(null)} 
      />
      
      {/* Multiplayer UI */}
      <MultiplayerUI multiplayerManager={multiplayerManager} />
      
      {/* PvP Combat UI */}
      <PvPCombatUI multiplayerManager={multiplayerManager} />
    </div>
  );
}; 