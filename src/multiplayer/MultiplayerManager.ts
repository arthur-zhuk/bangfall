import { io, Socket } from 'socket.io-client';
import { EventBus } from '../game/EventBus';

export interface MultiplayerPlayer {
  id: string;
  username: string;
  room: string;
  position: { x: number; y: number };
  stats: {
    level: number;
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    totalXP: number;
  };
  inCombat: boolean;
  combatTarget: string | null;
}

export interface ChatMessage {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}

export class MultiplayerManager {
  private socket: Socket | null = null;
  private connected = false;
  private connecting = false; // Add connecting state
  private playerData: MultiplayerPlayer | null = null;
  private otherPlayers: Map<string, MultiplayerPlayer> = new Map();
  private chatMessages: ChatMessage[] = [];
  private listeners: { [event: string]: Function[] } = {};

  constructor() {
    this.setupEventListeners();
  }

  // Connection management
  public connect(serverUrl: string = 'http://localhost:3001'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately
      if (this.connected && this.socket?.connected) {
        console.log('🔌 Already connected to multiplayer server');
        resolve(true);
        return;
      }
      
      // If already connecting, wait for that connection
      if (this.connecting) {
        console.log('🔌 Connection already in progress');
        reject(new Error('Connection already in progress'));
        return;
      }
      
      // If there's an existing socket, disconnect it first
      if (this.socket) {
        console.log('🔌 Disconnecting existing socket before reconnecting');
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.connecting = true;
      
      try {
        this.socket = io(serverUrl, {
          forceNew: true,
          transports: ['websocket'],
          timeout: 5000,
          reconnection: false // Disable automatic reconnection to prevent duplicates
        });

        this.socket.on('connect', () => {
          console.log('🔌 Connected to multiplayer server');
          this.connected = true;
          this.connecting = false;
          this.setupSocketListeners();
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Failed to connect to multiplayer server:', error);
          this.connected = false;
          this.connecting = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('🔌 Disconnected from multiplayer server');
          this.connected = false;
          this.connecting = false;
          this.playerData = null;
          this.otherPlayers.clear();
          this.emit('disconnected');
        });

      } catch (error) {
        console.error('❌ Error creating socket connection:', error);
        this.connecting = false;
        reject(error);
      }
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.playerData = null;
    this.otherPlayers.clear();
  }

  public isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Game actions
  public joinGame(username: string, room: string = 'default') {
    if (!this.isConnected()) return;
    
    this.socket?.emit('join-game', { username, room });
  }

  public updatePosition(x: number, y: number, direction?: string) {
    if (!this.isConnected()) return;

    this.socket?.emit('player-move', { x, y, direction });
  }

  public startActivity(activity: string, position: { x: number; y: number }) {
    if (!this.isConnected()) return;

    this.socket?.emit('start-activity', { activity, position });
  }

  public startCombat(targetType: string, targetId: string, position: { x: number; y: number }) {
    if (!this.isConnected()) return;

    this.socket?.emit('start-combat', { targetType, targetId, position });
  }

  public sendCombatAction(action: string) {
    if (!this.isConnected()) return;

    this.socket?.emit('combat-action', { action });
  }

  public sendChatMessage(message: string) {
    if (!this.isConnected()) return;

    this.socket?.emit('chat-message', { message });
  }

  // PvP Combat methods
  public challengePlayer(targetPlayerId: string) {
    if (!this.isConnected()) return;

    this.socket?.emit('challenge-player', { targetPlayerId });
  }

  public respondToChallenge(challengeId: string, accepted: boolean) {
    if (!this.isConnected()) return;

    this.socket?.emit('respond-to-challenge', { challengeId, accepted });
  }

  public pickupLoot(lootId: string, position: { x: number; y: number }) {
    if (!this.isConnected()) return;

    this.socket?.emit('pickup-loot', { lootId, position });
  }

  public equipWeapon(weapon: string) {
    if (!this.isConnected()) return;

    this.socket?.emit('equip-weapon', { weapon });
  }

  // Data getters
  public getPlayerData(): MultiplayerPlayer | null {
    return this.playerData;
  }

  public getOtherPlayers(): MultiplayerPlayer[] {
    return Array.from(this.otherPlayers.values());
  }

  public getChatMessages(): ChatMessage[] {
    return this.chatMessages;
  }

  // Event system
  public on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Socket event listeners
  private setupSocketListeners() {
    if (!this.socket) return;

    // Player data
    this.socket.on('player-data', (data: MultiplayerPlayer) => {
      this.playerData = data;
      console.log('🎮 Received player data:', data);
      this.emit('player-data', data);
    });

    // Other players
    this.socket.on('other-players', (players: MultiplayerPlayer[]) => {
      this.otherPlayers.clear();
      players.forEach(player => {
        this.otherPlayers.set(player.id, player);
      });
      console.log('👥 Received other players:', players);
      this.emit('other-players', players);
    });

    // Player joined
    this.socket.on('player-joined', (player: MultiplayerPlayer) => {
      this.otherPlayers.set(player.id, player);
      console.log('✅ Player joined:', player.username);
      this.emit('player-joined', player);
    });

    // Player left
    this.socket.on('player-left', (playerId: string) => {
      const player = this.otherPlayers.get(playerId);
      if (player) {
        this.otherPlayers.delete(playerId);
        console.log('❌ Player left:', player.username);
        this.emit('player-left', playerId);
      }
    });

    // Player movement
    this.socket.on('player-moved', (data: { playerId: string; position: { x: number; y: number }; direction?: string }) => {
      const player = this.otherPlayers.get(data.playerId);
      if (player) {
        player.position = data.position;
        // Note: direction is handled in the scene, not stored in MultiplayerPlayer
        this.emit('player-moved', data);
      }
    });

    // Activities
    this.socket.on('player-activity-start', (data: { playerId: string; activity: string; position: { x: number; y: number } }) => {
      console.log('🔨 Player activity started:', data);
      this.emit('player-activity-start', data);
    });

    this.socket.on('activity-complete', (data: { activity: string; rewards: any }) => {
      console.log('✅ Activity completed:', data);
      this.emit('activity-complete', data);
    });

    this.socket.on('player-activity-complete', (data: { playerId: string; activity: string; rewards: any }) => {
      console.log('✅ Other player activity completed:', data);
      this.emit('player-activity-complete', data);
    });

    // Combat
    this.socket.on('combat-started', (combat: any) => {
      console.log('⚔️ Combat started:', combat);
      this.emit('combat-started', combat);
    });

    this.socket.on('player-combat-start', (data: { playerId: string; position: { x: number; y: number }; combat: any }) => {
      console.log('⚔️ Other player combat started:', data);
      this.emit('player-combat-start', data);
    });

    this.socket.on('combat-update', (result: any) => {
      console.log('⚔️ Combat update:', result);
      this.emit('combat-update', result);
    });

    this.socket.on('player-combat-update', (data: { playerId: string; result: any }) => {
      console.log('⚔️ Other player combat update:', data);
      this.emit('player-combat-update', data);
    });

    this.socket.on('player-combat-end', (data: { playerId: string; victory: boolean }) => {
      console.log('⚔️ Combat ended:', data);
      this.emit('player-combat-end', data);
    });

    // Chat
    this.socket.on('chat-message', (data: ChatMessage) => {
      this.chatMessages.push(data);
      // Keep last 50 messages
      if (this.chatMessages.length > 50) {
        this.chatMessages = this.chatMessages.slice(-50);
      }
      console.log('💬 Chat message:', data);
      this.emit('chat-message', data);
    });

    // PvP Combat Events
    this.socket.on('pvp-challenge-received', (data: { challengeId: string; challengerName: string; challengerId: string }) => {
      console.log('⚔️ PvP challenge received from:', data.challengerName);
      this.emit('pvp-challenge-received', data);
    });

    this.socket.on('challenge-sent', (data: { challengeId: string; targetName: string }) => {
      console.log('⚔️ Challenge sent to:', data.targetName);
      this.emit('challenge-sent', data);
    });

    this.socket.on('challenge-declined', (data: { targetName: string }) => {
      console.log('⚔️ Challenge declined by:', data.targetName);
      this.emit('challenge-declined', data);
    });

    this.socket.on('challenge-failed', (data: { reason: string }) => {
      console.log('⚔️ Challenge failed:', data.reason);
      this.emit('challenge-failed', data);
    });

    this.socket.on('pvp-combat-started', (data: any) => {
      console.log('⚔️ PvP combat started:', data);
      this.emit('pvp-combat-started', data);
    });

    this.socket.on('pvp-combat-update', (data: any) => {
      console.log('⚔️ PvP combat update:', data);
      this.emit('pvp-combat-update', data);
    });

    this.socket.on('pvp-combat-ended', (data: any) => {
      console.log('⚔️ PvP combat ended:', data);
      this.emit('pvp-combat-ended', data);
    });

    this.socket.on('pvp-combat-spectate', (data: any) => {
      console.log('👀 PvP combat spectate:', data);
      this.emit('pvp-combat-spectate', data);
    });

    this.socket.on('pvp-combat-spectate-update', (data: any) => {
      console.log('👀 PvP combat spectate update:', data);
      this.emit('pvp-combat-spectate-update', data);
    });

    this.socket.on('pvp-combat-spectate-ended', (data: any) => {
      console.log('👀 PvP combat spectate ended:', data);
      this.emit('pvp-combat-spectate-ended', data);
    });

    // Loot system events
    this.socket.on('player-loot-dropped', (data: any) => {
      console.log('💰 Player loot dropped:', data);
      this.emit('player-loot-dropped', data);
    });

    this.socket.on('loot-pickup-success', (data: any) => {
      console.log('📦 Loot pickup success:', data);
      this.emit('loot-pickup-success', data);
    });

    this.socket.on('loot-pickup-failed', (data: any) => {
      console.log('📦 Loot pickup failed:', data);
      this.emit('loot-pickup-failed', data);
    });

    this.socket.on('loot-picked-up', (data: any) => {
      console.log('📦 Loot picked up by other player:', data);
      this.emit('loot-picked-up', data);
    });

    this.socket.on('weapon-equipped', (data: any) => {
      console.log('⚔️ Weapon equipped:', data);
      this.emit('weapon-equipped', data);
    });

    this.socket.on('player-respawned', (data: any) => {
      console.log('🔄 Player respawned:', data);
      this.emit('player-respawned', data);
    });
  }

  // Game event listeners
  private setupEventListeners() {
    // Listen for local game events and sync them to multiplayer
    EventBus.on('player-move', (data: { x: number; y: number; direction?: string }) => {
      this.updatePosition(data.x, data.y, data.direction);
    });

    EventBus.on('activity-started', (data: { activity: string; position: { x: number; y: number } }) => {
      this.startActivity(data.activity, data.position);
    });

    EventBus.on('combat-started', (data: { targetType: string; targetId: string; position: { x: number; y: number } }) => {
      this.startCombat(data.targetType, data.targetId, data.position);
    });

    EventBus.on('combat-action', (data: { action: string }) => {
      this.sendCombatAction(data.action);
    });
  }

  // Utility methods
  public getPlayerCount(): number {
    return this.otherPlayers.size + (this.playerData ? 1 : 0);
  }

  public getPlayerByName(username: string): MultiplayerPlayer | null {
    if (this.playerData?.username === username) {
      return this.playerData;
    }

    for (const player of this.otherPlayers.values()) {
      if (player.username === username) {
        return player;
      }
    }

    return null;
  }

  public getRoomPlayers(): MultiplayerPlayer[] {
    const players: MultiplayerPlayer[] = [];
    
    if (this.playerData) {
      players.push(this.playerData);
    }
    
    players.push(...this.getOtherPlayers());
    
    return players;
  }

  // Connection status
  public getConnectionStatus() {
    return {
      connected: this.isConnected(),
      playerCount: this.getPlayerCount(),
      playerId: this.playerData?.id,
      playerName: this.playerData?.username,
      room: this.playerData?.room
    };
  }
} 