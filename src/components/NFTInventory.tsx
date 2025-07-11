import React, { useState, useEffect } from 'react'
import { useSmartWallet } from './SmartWalletProvider'
import { ethers } from 'ethers'
import { GameItemsABI, CONTRACT_ADDRESS } from '../contracts/GameItems'

interface NFTItem {
  id: number
  name: string
  quantity: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: 'resource' | 'food' | 'equipment' | 'potion'
  emoji: string
  description: string
}

const NFT_ITEMS: Record<number, Omit<NFTItem, 'id' | 'quantity'>> = {
  1: { name: 'Rock', emoji: '🪨', rarity: 'common', category: 'resource', description: 'A common stone' },
  2: { name: 'Wood', emoji: '🪵', rarity: 'common', category: 'resource', description: 'Sturdy tree wood' },
  3: { name: 'Iron Ore', emoji: '🔩', rarity: 'rare', category: 'resource', description: 'Raw iron ore' },
  4: { name: 'Gold Ore', emoji: '✨', rarity: 'rare', category: 'resource', description: 'Precious gold ore' },
  5: { name: 'Diamond', emoji: '💎', rarity: 'epic', category: 'resource', description: 'Brilliant diamond' },
  6: { name: 'Emerald', emoji: '💚', rarity: 'legendary', category: 'resource', description: 'Mystical emerald' },
  7: { name: 'Raw Fish', emoji: '🐟', rarity: 'common', category: 'food', description: 'Fresh caught fish' },
  8: { name: 'Cooked Fish', emoji: '🍖', rarity: 'common', category: 'food', description: 'Delicious cooked fish' },
  9: { name: 'Bread', emoji: '🍞', rarity: 'common', category: 'food', description: 'Freshly baked bread' },
  10: { name: 'Cake', emoji: '🍰', rarity: 'rare', category: 'food', description: 'Sweet celebration cake' },
  11: { name: 'Sword', emoji: '⚔️', rarity: 'rare', category: 'equipment', description: 'Sharp steel sword' },
  12: { name: 'Shield', emoji: '🛡️', rarity: 'rare', category: 'equipment', description: 'Protective shield' },
  13: { name: 'Armor', emoji: '🛡️', rarity: 'rare', category: 'equipment', description: 'Protective armor' },
  14: { name: 'Health Potion', emoji: '❤️', rarity: 'common', category: 'potion', description: 'Restores health' },
  15: { name: 'Magic Scroll', emoji: '📜', rarity: 'rare', category: 'potion', description: 'Contains magic spell' }
}

const getRarityColor = (rarity: string, opacity: number = 1) => {
  switch (rarity) {
    case 'common': return `rgba(149, 165, 166, ${opacity})`
    case 'rare': return `rgba(52, 152, 219, ${opacity})`
    case 'epic': return `rgba(155, 89, 182, ${opacity})`
    case 'legendary': return `rgba(243, 156, 18, ${opacity})`
    default: return `rgba(149, 165, 166, ${opacity})`
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'resource': return '#8e44ad'
    case 'food': return '#27ae60'
    case 'equipment': return '#e74c3c'
    case 'potion': return '#3498db'
    default: return '#95a5a6'
  }
}

export const NFTInventory = () => {
  const { isConnected, address } = useSmartWallet()
  const [inventory, setInventory] = useState<NFTItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isVisible, setIsVisible] = useState(true) // Always visible in sidebar
  const [notification, setNotification] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<NFTItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Add CSS animation for notifications
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Function to load real NFT data from blockchain
  const loadBlockchainInventory = async (currentInventory?: NFTItem[]) => {
    if (!address) return

    try {
      setIsLoading(true)
      console.log('🔗 Loading NFT inventory from blockchain for account:', address)
      
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, GameItemsABI, provider)
      const account = address

      const blockchainInventory = await contract.getPlayerInventory(account)
      console.log('📦 Blockchain inventory data:', blockchainInventory)
      
      // Convert blockchain data to our NFT format
      const nftItems: NFTItem[] = []
      
      // Handle the tuple response from Solidity - ethers.js returns Result objects
      let ids, balances, names;
      
      // The contract returns a tuple (uint256[] ids, uint256[] balances, string[] names)
      // ethers.js wraps this in a Result object that can be accessed by index
      try {
        // Access the tuple elements by index
        ids = blockchainInventory[0];
        balances = blockchainInventory[1]; 
        names = blockchainInventory[2];
        
        console.log('📦 Parsed data:', { 
          ids: ids ? Array.from(ids) : null, 
          balances: balances ? Array.from(balances) : null, 
          names: names ? Array.from(names) : null 
        });
        
        // Convert to regular arrays and process
        if (ids && balances && ids.length > 0) {
          for (let i = 0; i < ids.length; i++) {
            const itemId = Number(ids[i]);
            const balance = Number(balances[i]);
            
            console.log(`📦 Item ${i}: ID=${itemId}, Balance=${balance}`);
            
            if (balance > 0 && NFT_ITEMS[itemId]) {
              nftItems.push({
                id: itemId,
                quantity: balance,
                ...NFT_ITEMS[itemId]
              });
              console.log(`✅ Added ${NFT_ITEMS[itemId].name} x${balance}`);
            }
          }
        } else {
          console.log('⚠️ No items found in blockchain inventory arrays');
        }
      } catch (parseError) {
        console.error('❌ Error parsing blockchain inventory:', parseError);
        console.log('Raw response:', blockchainInventory);
      }
      
      console.log('✅ Converted NFT items from blockchain:', nftItems)
      
      // Smart inventory update logic:
      // 1. If blockchain has items, always use them (they're authoritative)
      // 2. If blockchain is empty AND current inventory is empty, set empty inventory
      // 3. If blockchain is empty BUT we have current inventory, keep the current inventory
      const inventoryToCheck = currentInventory || inventory
      
      if (nftItems.length > 0) {
        console.log('📦 Updating inventory from blockchain (blockchain has data)')
        setInventory(nftItems)
        
        // Save to localStorage as backup
        if (address) {
          localStorage.setItem(`nft-inventory-${address}`, JSON.stringify(nftItems))
        }
      } else if (inventoryToCheck.length === 0) {
        console.log('📦 Setting empty inventory (blockchain empty, current inventory empty)')
        setInventory([])
      } else {
        console.log('📦 Keeping existing inventory (blockchain empty, but we have local data)')
        console.log('📦 Current inventory being preserved:', inventoryToCheck)
        // Don't override - keep the existing inventory that was loaded from localStorage
      }
      
    } catch (error) {
      console.error('❌ Failed to load blockchain inventory:', error)
      
      // Only fallback to localStorage if we don't already have inventory loaded
      const inventoryToCheck = currentInventory || inventory
      if (inventoryToCheck.length === 0 && address) {
        const savedInventory = localStorage.getItem(`nft-inventory-${address}`)
        if (savedInventory) {
          try {
            const parsedInventory = JSON.parse(savedInventory)
            console.log('📦 Fallback: Loaded inventory from localStorage:', parsedInventory)
            setInventory(parsedInventory)
          } catch (parseError) {
            console.error('❌ Failed to parse localStorage inventory:', parseError)
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Load inventory from localStorage as soon as we have an address
  useEffect(() => {
    if (address) {
      console.log('🔍 Loading inventory from localStorage for address:', address)
      const savedInventory = localStorage.getItem(`nft-inventory-${address}`)
      if (savedInventory) {
        try {
          const parsedInventory = JSON.parse(savedInventory)
          console.log('📦 Successfully loaded inventory from localStorage:', parsedInventory)
          setInventory(parsedInventory)
        } catch (error) {
          console.error('❌ Failed to parse localStorage inventory:', error)
        }
      } else {
        console.log('📦 No saved inventory found in localStorage for address:', address)
      }
    }
  }, [address]) // Only depend on address, not isConnected

  // Load inventory when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔮 Smart wallet connected, loading inventory...')
      console.log('🔍 Current inventory before blockchain load:', inventory)
      
      // Add a small delay to ensure localStorage is loaded first
      setTimeout(() => {
                  // Get the current inventory state at the time of the timeout
          setInventory(currentInventory => {
            console.log('🔍 Current inventory at timeout:', currentInventory)
            // Call blockchain load but pass the current inventory
            loadBlockchainInventory(currentInventory)
            return currentInventory // Don't change the inventory here
          })
      }, 500) // Increased delay to ensure localStorage loads first
    }
  }, [isConnected, address])

  // Listen for Smart Wallet activity updates
  useEffect(() => {
    const handleSmartWalletActivity = (event: CustomEvent) => {
      const { itemId, quantity, itemName } = event.detail
      
      setInventory(prev => {
        const existingItem = prev.find(item => item.id === itemId)
        let newInventory: NFTItem[]
        
        if (existingItem) {
          // Update existing item
          newInventory = prev.map(item =>
            item.id === itemId 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        } else {
          // Add new item
          const newItem: NFTItem = {
            id: itemId,
            quantity,
            ...NFT_ITEMS[itemId]
          }
          newInventory = [...prev, newItem]
        }
        
        // Save to localStorage
        if (address) {
          localStorage.setItem(`nft-inventory-${address}`, JSON.stringify(newInventory))
        }
        
        return newInventory
      })

      // Show notification
      const item = NFT_ITEMS[itemId]
      if (item) {
        setNotification(`${item.emoji} +${quantity} ${item.name}`)
        setTimeout(() => setNotification(null), 3000)
      }
    }

    // Handle NFT loot from combat
    const handleNFTLoot = (event: CustomEvent) => {
      const { itemId, itemName, rarity, value, quantity } = event.detail
      
      // Create a new NFT item for the loot
      const newLootItem: NFTItem = {
        id: itemId,
        name: itemName,
        quantity,
        rarity: rarity.toLowerCase() as 'common' | 'rare' | 'epic' | 'legendary',
        category: 'equipment',
        emoji: '⚔️', // Default emoji for combat loot
        description: `Dropped by goblin. Value: ${value} gold`
      }
      
      setInventory(prev => {
        const existingItem = prev.find(item => item.id === itemId)
        let newInventory: NFTItem[]
        
        if (existingItem) {
          // Update existing item
          newInventory = prev.map(item =>
            item.id === itemId 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        } else {
          // Add new item
          newInventory = [...prev, newLootItem]
        }
        
        // Save to localStorage
        if (address) {
          localStorage.setItem(`nft-inventory-${address}`, JSON.stringify(newInventory))
        }
        
        return newInventory
      })

      // Show notification with rarity color
      const rarityEmoji: Record<string, string> = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟠'
      }
      const emoji = rarityEmoji[rarity.toLowerCase()] || '⚪'
      
      setNotification(`${emoji} ${itemName} (${rarity})`)
      setTimeout(() => setNotification(null), 4000)
    }

    // Listen for custom events from Smart Wallet activities
    window.addEventListener('smartWalletItemEarned', handleSmartWalletActivity as EventListener)
    
    // Listen for NFT loot events
    window.addEventListener('nft-loot-obtained', handleNFTLoot as EventListener)
    
    return () => {
      window.removeEventListener('smartWalletItemEarned', handleSmartWalletActivity as EventListener)
      window.removeEventListener('nft-loot-obtained', handleNFTLoot as EventListener)
    }
  }, [address])

  // Function to add test items (for debugging)
  const addTestItems = () => {
    const testItems: NFTItem[] = [
      { id: 1, name: 'Rock', quantity: 10, emoji: '🪨', rarity: 'common', category: 'resource', description: 'A common stone' },
      { id: 7, name: 'Raw Fish', quantity: 5, emoji: '🐟', rarity: 'common', category: 'food', description: 'Fresh caught fish' },
      { id: 3, name: 'Iron Ore', quantity: 3, emoji: '🔩', rarity: 'rare', category: 'resource', description: 'Raw iron ore' },
      { id: 11, name: 'Sword', quantity: 1, emoji: '⚔️', rarity: 'rare', category: 'equipment', description: 'Sharp steel sword' },
      { id: 5, name: 'Diamond', quantity: 2, emoji: '💎', rarity: 'epic', category: 'resource', description: 'Brilliant diamond' }
    ]
    
    setInventory(testItems)
    
    // Save to localStorage
    if (address) {
      localStorage.setItem(`nft-inventory-${address}`, JSON.stringify(testItems))
    }
    
    setNotification('🎮 Test items added to inventory!')
    setTimeout(() => setNotification(null), 3000)
  }

  // Debug function to check localStorage
  const debugLocalStorage = () => {
    if (address) {
      const key = `nft-inventory-${address}`
      const saved = localStorage.getItem(key)
      console.log('🔍 Debug localStorage:')
      console.log('Key:', key)
      console.log('Saved data:', saved)
      console.log('Current inventory:', inventory)
      console.log('All localStorage keys:', Object.keys(localStorage))
      console.log('isConnected:', isConnected)
      console.log('address:', address)
      
      setNotification(`📋 Debug info logged to console`)
      setTimeout(() => setNotification(null), 3000)
    } else {
      console.log('🔍 Debug: No address available')
      setNotification(`❌ No address available for debug`)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const filteredInventory = inventory.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  )

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0)

  if (!isConnected) {
    return null
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#333',
        borderRadius: '6px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          color: '#8e44ad'
        }}>
          🎒 NFT Inventory
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {isConnected && (
            <button
              onClick={() => loadBlockchainInventory()}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#95a5a6' : '#27ae60',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {isLoading ? '🔄' : '🔄'}
            </button>
          )}
          
          <button
            onClick={addTestItems}
            style={{
              backgroundColor: '#e67e22',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🧪
          </button>
          
          <button
            onClick={debugLocalStorage}
            style={{
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔍
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          backgroundColor: '#2ecc71',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          marginBottom: '10px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notification}
        </div>
      )}

      {/* Connection Status */}
      <div style={{
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <div>Smart Wallet: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
        <div>Wallet: {address?.slice(0, 8)}...{address?.slice(-6)}</div>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}>
        {['all', 'resource', 'food', 'equipment', 'potion'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              backgroundColor: selectedCategory === category ? '#8e44ad' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '11px',
              textTransform: 'capitalize'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '5px'
      }}>
        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#3498db'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
            <div>Loading NFT data...</div>
          </div>
        )}

        {filteredInventory.length === 0 && !isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '30px',
            color: '#7f8c8d'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📦</div>
            <div style={{ fontSize: '16px', marginBottom: '10px' }}>No items found</div>
            <div style={{ fontSize: '12px' }}>
              {isConnected ? 'Play the game to earn NFT items!' : 'Connect your Smart Wallet to see your blockchain items'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '8px'
          }}>
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  backgroundColor: getRarityColor(item.rarity),
                  border: `2px solid ${getRarityColor(item.rarity, 0.3)}`,
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                  {item.emoji}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '12px', color: 'white', marginTop: '2px' }}>
                  {item.quantity}
                </div>
                
                {/* Rarity indicator */}
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getRarityColor(item.rarity)
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
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
            padding: '25px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: getRarityColor(selectedItem.rarity) }}>
                {selectedItem.emoji} {selectedItem.name}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#e74c3c',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                <strong>Quantity:</strong> {selectedItem.quantity}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                <strong>Rarity:</strong> <span style={{ color: getRarityColor(selectedItem.rarity), textTransform: 'capitalize' }}>{selectedItem.rarity}</span>
              </div>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                <strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedItem.category}</span>
              </div>
            </div>
            
            <div style={{ fontSize: '13px', color: '#bdc3c7', lineHeight: '1.4' }}>
              {selectedItem.description}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 