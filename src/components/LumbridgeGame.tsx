import React, { useRef, useEffect, useState } from 'react';
import { PhaserGame, type IRefPhaserGame } from '../game/PhaserGame';
import { EventBus } from '../game/EventBus';
import { NFTInventory } from './NFTInventory';

export const LumbridgeGame = () => {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const [currentScene, setCurrentScene] = useState<Phaser.Scene | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    // Listen for item obtained events from activities
    EventBus.on('item-obtained', (data: { itemId: number; itemName: string; activity: string }) => {
      console.log('Item obtained:', data);
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
      EventBus.removeAllListeners();
    };
  }, []);

  const onCurrentActiveScene = (scene: Phaser.Scene) => {
    setCurrentScene(scene);
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
            <div>Health: 10/10</div>
            <div>Attack: 5</div>
            <div>Defense: 2</div>
            <div>Level: 1</div>
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
    </div>
  );
}; 