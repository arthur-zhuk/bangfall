import { useState, useEffect, useRef } from 'react';
import { MultiplayerManager, type MultiplayerPlayer, type ChatMessage } from '../multiplayer/MultiplayerManager';

interface MultiplayerUIProps {
  multiplayerManager: MultiplayerManager;
}

export const MultiplayerUI = ({ multiplayerManager }: MultiplayerUIProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [username, setUsername] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [otherPlayers, setOtherPlayers] = useState<MultiplayerPlayer[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Setup multiplayer event listeners
    const handleConnected = () => {
      setIsConnected(true);
      setConnecting(false);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnecting(false);
    };

    const handleOtherPlayers = (players: MultiplayerPlayer[]) => {
      setOtherPlayers(players);
    };

    const handlePlayerJoined = (player: MultiplayerPlayer) => {
      setOtherPlayers(prev => [...prev, player]);
    };

    const handlePlayerLeft = (playerId: string) => {
      setOtherPlayers(prev => prev.filter(p => p.id !== playerId));
    };

    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    };

    // Add listeners
    multiplayerManager.on('player-data', handleConnected);
    multiplayerManager.on('disconnected', handleDisconnected);
    multiplayerManager.on('other-players', handleOtherPlayers);
    multiplayerManager.on('player-joined', handlePlayerJoined);
    multiplayerManager.on('player-left', handlePlayerLeft);
    multiplayerManager.on('chat-message', handleChatMessage);

    // Check initial connection state
    setIsConnected(multiplayerManager.isConnected());

    return () => {
      // Cleanup listeners
      multiplayerManager.off('player-data', handleConnected);
      multiplayerManager.off('disconnected', handleDisconnected);
      multiplayerManager.off('other-players', handleOtherPlayers);
      multiplayerManager.off('player-joined', handlePlayerJoined);
      multiplayerManager.off('player-left', handlePlayerLeft);
      multiplayerManager.off('chat-message', handleChatMessage);
    };
  }, [multiplayerManager]);

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleConnect = async () => {
    if (!username.trim()) {
      alert('Please enter a username!');
      return;
    }

    setConnecting(true);
    try {
      await multiplayerManager.connect();
      multiplayerManager.joinGame(username.trim());
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnecting(false);
      alert('Failed to connect to multiplayer server!');
    }
  };

  const handleDisconnect = () => {
    multiplayerManager.disconnect();
    setOtherPlayers([]);
    setChatMessages([]);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !isConnected) return;
    
    multiplayerManager.sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendChat();
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: '10px',
      right: '410px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '10px',
      padding: '15px',
      color: 'white',
      minWidth: '300px',
      maxWidth: '400px'
    }}>
      {/* Connection Section */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>🌐 Multiplayer</h3>
        
        {!isConnected ? (
          <div>
            <input
              type="text"
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                borderRadius: '5px',
                border: '1px solid #555',
                backgroundColor: '#333',
                color: 'white'
              }}
              disabled={connecting}
            />
            <button
              onClick={handleConnect}
              disabled={connecting || !username.trim()}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: connecting ? '#666' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: connecting ? 'not-allowed' : 'pointer'
              }}
            >
              {connecting ? '🔄 Connecting...' : '🔌 Connect'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ color: '#4CAF50' }}>✅ Connected</span>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Disconnect
              </button>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <button
                onClick={() => setShowPlayerList(!showPlayerList)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: showPlayerList ? '#2196F3' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                👥 Players ({otherPlayers.length + 1})
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: showChat ? '#FF9800' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                💬 Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Player List */}
      {isConnected && showPlayerList && (
        <div style={{ 
          marginBottom: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '5px',
          padding: '10px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>👥 Players Online</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {/* Current player */}
            <div style={{ 
              padding: '5px 0',
              borderBottom: '1px solid #333',
              fontSize: '14px'
            }}>
              <span style={{ color: '#4CAF50' }}>🟢 {username} (You)</span>
            </div>
            
            {/* Other players */}
            {otherPlayers.map(player => (
              <div key={player.id} style={{ 
                padding: '5px 0',
                borderBottom: '1px solid #333',
                fontSize: '14px'
              }}>
                <span style={{ color: player.inCombat ? '#FF9800' : '#fff' }}>
                  {player.inCombat ? '⚔️' : '🟢'} {player.username}
                </span>
                <span style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>
                  Lv.{player.stats.level}
                </span>
              </div>
            ))}
            
            {otherPlayers.length === 0 && (
              <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                No other players online
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat */}
      {isConnected && showChat && (
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '5px',
          padding: '10px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>💬 Chat</h4>
          
          {/* Chat messages */}
          <div style={{ 
            height: '150px',
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '3px',
            padding: '8px',
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            {chatMessages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  {msg.username}:
                </span>
                <span style={{ marginLeft: '5px' }}>
                  {msg.message}
                </span>
              </div>
            ))}
            
            {chatMessages.length === 0 && (
              <div style={{ color: '#888', fontStyle: 'italic' }}>
                No messages yet. Say hello!
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* Chat input */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '3px',
                border: '1px solid #555',
                backgroundColor: '#333',
                color: 'white',
                fontSize: '12px'
              }}
              maxLength={200}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              style={{
                padding: '6px 12px',
                backgroundColor: chatInput.trim() ? '#4CAF50' : '#555',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                fontSize: '12px'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 