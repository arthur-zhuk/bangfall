import { useState, useEffect } from 'react'
import { getAlchemyStatus } from '../config/alchemy'

export const SmartWalletSetup = () => {
  const [setupStatus, setSetupStatus] = useState(getAlchemyStatus())
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setSetupStatus(getAlchemyStatus())
  }, [])

  const handleRefresh = () => {
    setSetupStatus(getAlchemyStatus())
  }

  if (setupStatus.status === 'ready') {
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
        <span style={{ fontSize: '16px' }}>✅</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Smart Wallet Ready</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Alchemy integration configured
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: 'rgba(241, 196, 15, 0.1)',
      color: '#f1c40f',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #f1c40f',
      position: 'relative'
    }}>
      <span style={{ fontSize: '16px' }}>⚙️</span>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Setup Required</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {setupStatus.message}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            color: '#3498db',
            border: '1px solid #3498db',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showDetails ? '📁' : '📋'}
        </button>
        
        <button
          onClick={handleRefresh}
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
          🔄
        </button>
      </div>

      {/* Details Dropdown */}
      {showDetails && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: '6px',
          padding: '15px',
          minWidth: '350px',
          maxWidth: '400px',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>
            Smart Wallet Setup Guide
          </div>
          
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '10px' }}>
            <strong>Benefits:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>No MetaMask required</li>
              <li>Social login (Google, Facebook)</li>
              <li>Sponsored gas fees</li>
              <li>Better security</li>
            </ul>
          </div>

          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#bdc3c7',
            fontFamily: 'monospace',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {setupStatus.instructions}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// Remove the QuickSetup component as it's no longer needed
export const QuickSetup = () => null 