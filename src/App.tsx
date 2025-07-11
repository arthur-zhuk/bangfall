import { LumbridgeGame } from './components/LumbridgeGame'
import { SmartWalletSetup } from './components/SmartWalletSetup'
import { SmartWalletProvider, SmartWalletLogin } from './components/SmartWalletProvider'
import './App.css'

function App() {
  return (
    <SmartWalletProvider>
      <div className="App" style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        overflow: 'hidden'
      }}>
        {/* Top UI Bar */}
        <div style={{
          height: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#2a2a2a',
          borderBottom: '2px solid #444',
          padding: '0 20px',
          zIndex: 1000
        }}>
          {/* Left side - Wallet Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <SmartWalletLogin />
          </div>
          
          {/* Right side - Setup Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <SmartWalletSetup />
          </div>
        </div>

        {/* Main Game Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <LumbridgeGame />
        </div>
      </div>
    </SmartWalletProvider>
  )
}

export default App
