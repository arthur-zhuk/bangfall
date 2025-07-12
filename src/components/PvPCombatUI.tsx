import { useState, useEffect } from 'react';
import { MultiplayerManager, type MultiplayerPlayer } from '../multiplayer/MultiplayerManager';

interface PvPCombatUIProps {
  multiplayerManager: MultiplayerManager;
}

interface PvPChallenge {
  challengeId: string;
  challengerName: string;
  challengerId: string;
}

interface PlayerStats {
  health: number;
  maxHealth: number;
}

interface Opponent {
  name: string;
  id: string;
}

interface CombatInfo {
  round: number;
}

interface PvPCombat {
  combat: CombatInfo;
  yourTurn: boolean;
  opponent: Opponent;
  yourStats?: PlayerStats;
  opponentStats?: PlayerStats;
}

export const PvPCombatUI = ({ multiplayerManager }: PvPCombatUIProps) => {
  const [otherPlayers, setOtherPlayers] = useState<MultiplayerPlayer[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<PvPChallenge | null>(null);
  const [activeCombat, setActiveCombat] = useState<PvPCombat | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [showChallengeList, setShowChallengeList] = useState(false);

  useEffect(() => {
    // Get other players
    const updateOtherPlayers = () => {
      if (multiplayerManager.isConnected()) {
        setOtherPlayers(multiplayerManager.getOtherPlayers());
      }
    };

    // Update initially and when players change
    updateOtherPlayers();
    
    // PvP event handlers
    const handleChallengeReceived = (data: PvPChallenge) => {
      setIncomingChallenge(data);
    };

    const handleChallengeSent = (data: { challengeId: string; targetName: string }) => {
      setCombatLog(prev => [...prev, `Challenge sent to ${data.targetName}`]);
    };

    const handleChallengeDeclined = (data: { targetName: string }) => {
      setCombatLog(prev => [...prev, `${data.targetName} declined your challenge`]);
    };

    const handleChallengeFailed = (data: { reason: string }) => {
      setCombatLog(prev => [...prev, `Challenge failed: ${data.reason}`]);
    };

    const handlePvPCombatStarted = (data: PvPCombat) => {
      setActiveCombat(data);
      setIncomingChallenge(null);
      setCombatLog([`PvP combat started against ${data.opponent.name}!`]);
    };

    const handlePvPCombatUpdate = (data: { yourTurn: boolean; yourStats: PlayerStats; opponentStats: PlayerStats; actionResult: string }) => {
      if (activeCombat) {
        setActiveCombat(prev => ({
          ...prev!,
          yourTurn: data.yourTurn,
          yourStats: data.yourStats,
          opponentStats: data.opponentStats
        }));
        setCombatLog(prev => [...prev, data.actionResult]);
      }
    };

    const handlePvPCombatEnded = (data: { winnerName: string; victory: boolean; xpGained?: number }) => {
      setCombatLog(prev => [...prev, `Combat ended! ${data.winnerName} wins!`]);
      if (data.victory && data.xpGained) {
        setCombatLog(prev => [...prev, `You gained ${data.xpGained} XP!`]);
      }
      setActiveCombat(null);
    };

    // Add event listeners
    multiplayerManager.on('other-players', updateOtherPlayers);
    multiplayerManager.on('player-joined', updateOtherPlayers);
    multiplayerManager.on('player-left', updateOtherPlayers);
    multiplayerManager.on('pvp-challenge-received', handleChallengeReceived);
    multiplayerManager.on('challenge-sent', handleChallengeSent);
    multiplayerManager.on('challenge-declined', handleChallengeDeclined);
    multiplayerManager.on('challenge-failed', handleChallengeFailed);
    multiplayerManager.on('pvp-combat-started', handlePvPCombatStarted);
    multiplayerManager.on('pvp-combat-update', handlePvPCombatUpdate);
    multiplayerManager.on('pvp-combat-ended', handlePvPCombatEnded);

    return () => {
      // Cleanup listeners
      multiplayerManager.off('other-players', updateOtherPlayers);
      multiplayerManager.off('player-joined', updateOtherPlayers);
      multiplayerManager.off('player-left', updateOtherPlayers);
      multiplayerManager.off('pvp-challenge-received', handleChallengeReceived);
      multiplayerManager.off('challenge-sent', handleChallengeSent);
      multiplayerManager.off('challenge-declined', handleChallengeDeclined);
      multiplayerManager.off('challenge-failed', handleChallengeFailed);
      multiplayerManager.off('pvp-combat-started', handlePvPCombatStarted);
      multiplayerManager.off('pvp-combat-update', handlePvPCombatUpdate);
      multiplayerManager.off('pvp-combat-ended', handlePvPCombatEnded);
    };
  }, [multiplayerManager, activeCombat]);

  const challengePlayer = (playerId: string) => {
    multiplayerManager.challengePlayer(playerId);
    setShowChallengeList(false);
  };

  const respondToChallenge = (accepted: boolean) => {
    if (incomingChallenge) {
      multiplayerManager.respondToChallenge(incomingChallenge.challengeId, accepted);
      setIncomingChallenge(null);
    }
  };



  // Don't show if not connected
  if (!multiplayerManager.isConnected()) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderRadius: '10px',
      padding: '15px',
      color: 'white',
      minWidth: '300px',
      maxWidth: '400px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#FF6B6B' }}>⚔️ PvP Combat</h3>

      {/* Incoming Challenge */}
      {incomingChallenge && (
        <div style={{
          backgroundColor: '#FF6B6B',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>{incomingChallenge.challengerName}</strong> challenges you to combat!
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => respondToChallenge(true)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Accept
            </button>
            <button
              onClick={() => respondToChallenge(false)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Active Combat */}
      {activeCombat && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>
            Fighting {activeCombat.opponent.name} (Round {activeCombat.combat.round})
          </h4>
          
          {/* Health bars */}
          {activeCombat.yourStats && activeCombat.opponentStats && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ marginBottom: '5px' }}>
                <span style={{ fontSize: '12px' }}>Your Health: {activeCombat.yourStats.health}/{activeCombat.yourStats.maxHealth}</span>
                <div style={{
                  backgroundColor: '#333',
                  borderRadius: '3px',
                  height: '8px',
                  overflow: 'hidden',
                  marginTop: '2px'
                }}>
                  <div style={{
                    backgroundColor: '#4CAF50',
                    height: '100%',
                    width: `${(activeCombat.yourStats.health / activeCombat.yourStats.maxHealth) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '5px' }}>
                <span style={{ fontSize: '12px' }}>Enemy Health: {activeCombat.opponentStats.health}/{activeCombat.opponentStats.maxHealth}</span>
                <div style={{
                  backgroundColor: '#333',
                  borderRadius: '3px',
                  height: '8px',
                  overflow: 'hidden',
                  marginTop: '2px'
                }}>
                  <div style={{
                    backgroundColor: '#f44336',
                    height: '100%',
                    width: `${(activeCombat.opponentStats.health / activeCombat.opponentStats.maxHealth) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Loading message while waiting for combat stats */}
          {(!activeCombat.yourStats || !activeCombat.opponentStats) && (
            <div style={{ 
              marginBottom: '10px', 
              textAlign: 'center', 
              fontSize: '14px', 
              color: '#888' 
            }}>
              Preparing combat...
            </div>
          )}

          {/* Auto-combat status */}
          {activeCombat.yourStats && activeCombat.opponentStats && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#333',
              borderRadius: '5px'
            }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#4CAF50' }}>
                ⚔️ Auto-Combat Active
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#AAA' }}>
                {activeCombat.yourTurn ? 'Your turn next' : 'Opponent\'s turn next'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Challenge other players */}
      {!activeCombat && !incomingChallenge && (
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => setShowChallengeList(!showChallengeList)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#FF6B6B',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Challenge Player ({otherPlayers.length} online)
          </button>
          
          {showChallengeList && otherPlayers.length > 0 && (
            <div style={{
              marginTop: '10px',
              backgroundColor: '#333',
              borderRadius: '5px',
              padding: '10px',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              {otherPlayers.map(player => (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 0',
                    borderBottom: '1px solid #555'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{player.username}</span>
                  <button
                    onClick={() => challengePlayer(player.id)}
                    disabled={player.inCombat}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: player.inCombat ? '#666' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: player.inCombat ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {player.inCombat ? 'In Combat' : 'Challenge'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {showChallengeList && otherPlayers.length === 0 && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#333',
              borderRadius: '5px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#888'
            }}>
              No other players online
            </div>
          )}
        </div>
      )}

      {/* Combat log */}
      {combatLog.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Combat Log</h4>
          <div style={{
            backgroundColor: '#222',
            borderRadius: '5px',
            padding: '8px',
            maxHeight: '100px',
            overflowY: 'auto',
            fontSize: '12px'
          }}>
            {combatLog.slice(-5).map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 