import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getNetworkConfig } from '../config/alchemy'
// import { MagicSigner } from '@alchemy/aa-signers'

// Define SkillType as array for indexing
const SkillType = ['Mining', 'Fishing', 'Cooking', 'Combat', 'Crafting', 'Magic'];

// Helper function to parse transaction data and extract activity information
const parseTransactionData = (data: string) => {
  // Handle performActivity dummy selector
  if (data.startsWith('0x12345678')) {
    const skillId = parseInt(data.slice(2, 66), 16);
    const quantity = parseInt(data.slice(66, 130), 16);

    let itemId;
    let itemName;

    switch (skillId) {
      case 0: // MINING
        // Simple random: 40% Rock(1), 30% Wood(2), etc. But for mock, pick random
        const random = Math.floor(Math.random() * 100);
        if (random < 40) { itemId = 1; itemName = 'Rock'; }
        else if (random < 70) { itemId = 2; itemName = 'Wood'; }
        else if (random < 90) { itemId = 3; itemName = 'Iron Ore'; }
        else if (random < 97) { itemId = 4; itemName = 'Gold Ore'; }
        else if (random < 99) { itemId = 5; itemName = 'Diamond'; }
        else { itemId = 6; itemName = 'Emerald'; }
        break;
      case 1: // FISHING
        itemId = 7;
        itemName = 'Raw Fish';
        break;
      case 2: // COOKING
        const cookRandom = Math.floor(Math.random() * 100);
        if (cookRandom < 60) { itemId = 8; itemName = 'Cooked Fish'; }
        else if (cookRandom < 95) { itemId = 9; itemName = 'Bread'; }
        else { itemId = 10; itemName = 'Cake'; }
        break;
      case 3: // COMBAT
        const combatRandom = Math.floor(Math.random() * 100);
        if (combatRandom < 80) { itemId = 14; itemName = 'Health Potion'; }
        else { itemId = 11; itemName = 'Sword'; }
        break;
      case 4: // CRAFTING / Woodcutting
        itemId = 2;
        itemName = 'Wood';
        break;
      case 5: // MAGIC
        itemId = 15;
        itemName = 'Magic Scroll';
        break;
      default:
        return null;
    }

    return { itemId, quantity, itemName, activityName: SkillType[skillId] };
  }

  // Existing mine parsing...
  if (data.startsWith('0xbd4de891')) {
    // Extract item ID from the transaction data
    // This is a simplified extraction - in real app use proper ABI decoding
    const itemIdHex = data.slice(74, 138) // Extract itemId parameter
    const itemId = parseInt(itemIdHex, 16)
    
    // Map common activities to item IDs
    const itemMap: Record<number, { itemName: string, activityName: string }> = {
      1: { itemName: 'Rock', activityName: 'Mining' },
      2: { itemName: 'Coal', activityName: 'Mining' },
      3: { itemName: 'Iron Ore', activityName: 'Mining' },
      4: { itemName: 'Gold Ore', activityName: 'Mining' },
      5: { itemName: 'Diamond', activityName: 'Mining' },
      6: { itemName: 'Wood', activityName: 'Woodcutting' },
      7: { itemName: 'Raw Fish', activityName: 'Fishing' },
      8: { itemName: 'Salmon', activityName: 'Fishing' },
      9: { itemName: 'Cooked Fish', activityName: 'Cooking' },
      10: { itemName: 'Bread', activityName: 'Cooking' }
    }
    
    const itemInfo = itemMap[itemId]
    if (itemInfo) {
      return {
        itemId,
        quantity: 1, // Default quantity
        itemName: itemInfo.itemName,
        activityName: itemInfo.activityName
      }
    }
  }
  
  return null
}

interface SmartWalletContextType {
  smartAccount: any
  isConnected: boolean
  address: string | null
  login: (method: 'email' | 'google' | 'facebook') => Promise<void>
  logout: () => Promise<void>
  sendTransaction: (transaction: any) => Promise<string>
  isLoading: boolean
  error: string | null
}

const SmartWalletContext = createContext<SmartWalletContextType | null>(null)

export const useSmartWallet = () => {
  const context = useContext(SmartWalletContext)
  if (!context) {
    throw new Error('useSmartWallet must be used within a SmartWalletProvider')
  }
  return context
}

interface SmartWalletProviderProps {
  children: ReactNode
}

export const SmartWalletProvider = ({ children }: SmartWalletProviderProps) => {
  const [smartAccount, setSmartAccount] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSigner, setMagicSigner] = useState<any>(null)

  const networkConfig = getNetworkConfig()

  const initializeSmartAccount = async (method: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // For localhost development, we'll use a mock smart account
      if (networkConfig.chainId === 31337) {
        console.log('🔮 Using mock smart wallet for localhost development')
        const mockAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
        setAddress(mockAddress)
        setSmartAccount({ address: mockAddress, method })
        setIsConnected(true)
        return
      }

      // For production (Sepolia), use real Alchemy Account Kit
      console.log('🔮 Initializing real Alchemy Smart Account...')
      
      // For now, we'll use a simplified mock approach for production as well
      // TODO: Implement proper Alchemy signer once package issues are resolved
      console.log('🔮 Using simplified mock for production (temporary)')
      const mockAddress = '0x742d35Cc6634C0532925a3b8D2D35D2D2D2D2D2D'
      setAddress(mockAddress)
      setSmartAccount({ address: mockAddress, method })
      setIsConnected(true)
    } catch (err) {
      console.error('Failed to initialize smart account:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize smart account')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (method: 'email' | 'google' | 'facebook') => {
    try {
      setIsLoading(true)
      setError(null)

      // For localhost development, we'll simulate the login
      if (networkConfig.chainId === 31337) {
        await initializeSmartAccount(method)
        return
      }

      // For production, use real Alchemy authentication
      await initializeSmartAccount(method)
    } catch (err) {
      console.error('Login failed:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (magicSigner) {
        await magicSigner.disconnect()
      }
      setMagicSigner(null)
      setSmartAccount(null)
      setAddress(null)
      setIsConnected(false)
      setError(null)
    } catch (err) {
      console.error('Logout failed:', err)
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }

  const sendTransaction = async (transaction: any) => {
    try {
      setIsLoading(true)
      setError(null)

      // For localhost, Smart Wallet handles its own transactions
      if (networkConfig.chainId === 31337) {
        console.log('🔮 Smart Wallet: Processing transaction independently...', {
          to: transaction.to,
          from: address,
          data: transaction.data
        })
        
        // Simulate transaction processing time
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Mock successful transaction hash
        const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66)
        console.log('🔮 Smart Wallet: Transaction successful!', { txHash: mockTxHash })
        
        // Extract activity information from transaction data and emit event
        if (transaction.data) {
          const activityInfo = parseTransactionData(transaction.data)
          if (activityInfo) {
            // Emit custom event for inventory updates
            window.dispatchEvent(new CustomEvent('smartWalletItemEarned', {
              detail: activityInfo
            }))
          }
        }
        
        return mockTxHash
      }

      // For production smart accounts, use real Alchemy smart account client
      if (!smartAccount) {
        throw new Error('Smart account not initialized')
      }

      console.log('🔮 Sending real transaction via Alchemy Smart Account...', transaction)
      
      const txHash = await smartAccount.sendTransaction(transaction)
      console.log('🔮 Transaction sent:', txHash)
      
      // Extract activity information from transaction data and emit event
      if (transaction.data) {
        const activityInfo = parseTransactionData(transaction.data)
        if (activityInfo) {
          // Emit custom event for inventory updates
          window.dispatchEvent(new CustomEvent('smartWalletItemEarned', {
            detail: activityInfo
          }))
        }
      }
      
      return txHash
    } catch (err) {
      console.error('Transaction failed:', err)
      setError(err instanceof Error ? err.message : 'Transaction failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const value: SmartWalletContextType = {
    smartAccount,
    isConnected,
    address,
    login,
    logout,
    sendTransaction,
    isLoading,
    error
  }

  // Make Smart Wallet context available globally for the game
  useEffect(() => {
    ;(window as any).smartWalletContext = value
  }, [value])

  return (
    <SmartWalletContext.Provider value={value}>
      {children}
      {/* Add iframe container for Alchemy Signer */}
      <div id="alchemy-signer-iframe" style={{ display: 'none' }} />
    </SmartWalletContext.Provider>
  )
}

// Smart Wallet Login Component
export const SmartWalletLogin = () => {
  const { login, logout, isConnected, address, isLoading, error } = useSmartWallet()

  if (isConnected) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        color: '#2ecc71',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #2ecc71'
      }}>
        <span style={{ fontSize: '16px' }}>🔮</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Smart Wallet Connected</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Connected'}
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            color: '#e74c3c',
            border: '1px solid #e74c3c',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      color: '#3498db',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #3498db'
    }}>
      <span style={{ fontSize: '16px' }}>🔮</span>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Smart Wallet</div>
        {error && (
          <div style={{
            fontSize: '10px',
            color: '#e74c3c',
            marginTop: '2px'
          }}>
            {error}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => login('email')}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {isLoading ? '⏳' : '📧'}
        </button>
        
        <button
          onClick={() => login('google')}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#95a5a6' : '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {isLoading ? '⏳' : '🔍'}
        </button>
      </div>
    </div>
  )
} 