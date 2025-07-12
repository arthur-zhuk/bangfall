import { useState, useEffect } from 'react'

interface LevelUpNotificationProps {
  levelUpResult: {
    newLevel: number
    statIncreases: {
      hp: number
      attack: number
      defense: number
    }
    skillPointsGained: number
  } | null
  onClose: () => void
}

export const LevelUpNotification = ({ levelUpResult, onClose }: LevelUpNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (levelUpResult) {
      setIsVisible(true)
      setTimeout(() => setAnimate(true), 100)
      
      const timer = setTimeout(() => {
        setAnimate(false)
        setTimeout(() => {
          setIsVisible(false)
          onClose()
        }, 300)
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [levelUpResult, onClose])

  if (!isVisible || !levelUpResult) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        border: '3px solid #FFD700',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
        color: '#fff',
        textAlign: 'center',
        minWidth: '400px',
        opacity: animate ? 1 : 0,
        scale: animate ? 1 : 0.8,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Level up title */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '20px',
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        🎉 LEVEL UP! 🎉
      </div>

      {/* New level */}
      <div
        style={{
          fontSize: '24px',
          marginBottom: '20px',
          color: '#FFD700',
        }}
      >
        You are now Level {levelUpResult.newLevel}!
      </div>

      {/* Stat increases */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>Stat Increases:</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e74c3c',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
              ❤️ HP
            </div>
            <div style={{ fontSize: '20px', color: '#fff' }}>
              +{levelUpResult.statIncreases.hp}
            </div>
          </div>
          
          <div
            style={{
              backgroundColor: 'rgba(241, 196, 15, 0.2)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #f1c40f',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1c40f' }}>
              ⚔️ Attack
            </div>
            <div style={{ fontSize: '20px', color: '#fff' }}>
              +{levelUpResult.statIncreases.attack}
            </div>
          </div>
          
          <div
            style={{
              backgroundColor: 'rgba(52, 152, 219, 0.2)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #3498db',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>
              🛡️ Defense
            </div>
            <div style={{ fontSize: '20px', color: '#fff' }}>
              +{levelUpResult.statIncreases.defense}
            </div>
          </div>
        </div>
      </div>

      {/* Skill points */}
      {levelUpResult.skillPointsGained > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(155, 89, 182, 0.2)',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            border: '1px solid #9b59b6',
          }}
        >
          <h3 style={{ color: '#9b59b6', marginBottom: '10px' }}>
            ✨ Skill Points Gained: {levelUpResult.skillPointsGained}
          </h3>
          <div style={{ fontSize: '14px', color: '#ccc' }}>
            Use skill points to improve your abilities!
          </div>
        </div>
      )}

      {/* Particles/celebration effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: '20px',
        }}
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              backgroundColor: '#FFD700',
              borderRadius: '50%',
              left: `${20 + i * 10}%`,
              top: `${10 + (i % 3) * 30}%`,
              animation: animate ? `sparkle-${i} 2s ease-in-out infinite` : 'none',
              opacity: animate ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          setAnimate(false)
          setTimeout(() => {
            setIsVisible(false)
            onClose()
          }, 300)
        }}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginTop: '10px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#45a049'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4CAF50'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        Continue
      </button>

      {/* CSS animations */}
      <style>{`
        @keyframes sparkle-0 { 0%, 100% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes sparkle-1 { 0%, 100% { opacity: 0; transform: scale(0); } 60% { opacity: 1; transform: scale(1); } }
        @keyframes sparkle-2 { 0%, 100% { opacity: 0; transform: scale(0); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes sparkle-3 { 0%, 100% { opacity: 0; transform: scale(0); } 70% { opacity: 1; transform: scale(1); } }
        @keyframes sparkle-4 { 0%, 100% { opacity: 0; transform: scale(0); } 30% { opacity: 1; transform: scale(1); } }
        @keyframes sparkle-5 { 0%, 100% { opacity: 0; transform: scale(0); } 80% { opacity: 1; transform: scale(1); } }
        @keyframes sparkle-6 { 0%, 100% { opacity: 0; transform: scale(0); } 20% { opacity: 1; transform: scale(1); } }
        @keyframes sparkle-7 { 0%, 100% { opacity: 0; transform: scale(0); } 90% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
} 