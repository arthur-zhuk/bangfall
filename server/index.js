import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

const app = express();
const server = createServer(app);

// Production-ready CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://your-game-domain.com", "https://your-game-domain.netlify.app", "https://your-game-domain.vercel.app"]
    : ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
  methods: ["GET", "POST"],
  credentials: true
};

const io = new SocketIOServer(server, {
  cors: corsOptions
});

// Game state
const gameState = {
  players: new Map(),
  rooms: new Map(),
  activities: new Map(),
  combats: new Map()
};

// Player management
class Player {
  constructor(id, username, room = 'default') {
    this.id = id;
    this.username = username || `Player_${id.substring(0, 6)}`;
    this.room = room;
    
    // Random starting position to avoid overlap
    const baseX = 800;
    const baseY = 600;
    const randomOffsetX = (Math.random() - 0.5) * 300; // Random offset between -150 and 150
    const randomOffsetY = (Math.random() - 0.5) * 300; // Random offset between -150 and 150
    
    this.position = { 
      x: Math.max(100, Math.min(1500, baseX + randomOffsetX)), // Keep within world bounds
      y: Math.max(100, Math.min(1100, baseY + randomOffsetY))  // Keep within world bounds
    };
    
    console.log(`Player ${this.username} spawned at position:`, this.position);
    
    this.stats = {
      level: 1,
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 5,
      totalXP: 0
    };
    this.inCombat = false;
    this.combatTarget = null;
    this.lastActivity = Date.now();
    this.inventory = []; // Player inventory for loot drops
    this.equippedWeapon = 'bronze_sword'; // Default equipped weapon
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      room: this.room,
      position: this.position,
      stats: this.stats,
      inCombat: this.inCombat,
      combatTarget: this.combatTarget,
      inventory: this.inventory,
      equippedWeapon: this.equippedWeapon
    };
  }
}

// Room management
class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Set();
    this.activities = new Map();
    this.npcs = new Map();
    this.loot = new Map();
  }

  addPlayer(player) {
    this.players.add(player.id);
    console.log(`Player ${player.username} joined room ${this.id}`);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    console.log(`Player ${playerId} left room ${this.id}`);
  }

  getPlayerCount() {
    return this.players.size;
  }
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Player joins the game
  socket.on('join-game', (data) => {
    const { username, room = 'default' } = data || {};
    
    // Create player
    const player = new Player(socket.id, username, room);
    gameState.players.set(socket.id, player);
    
    // Create or join room
    if (!gameState.rooms.has(room)) {
      gameState.rooms.set(room, new GameRoom(room));
    }
    const gameRoom = gameState.rooms.get(room);
    gameRoom.addPlayer(player);
    
    // Join socket room
    socket.join(room);
    
    // Send player data to client
    socket.emit('player-data', player.toJSON());
    
    // Give new player starter loot
    addStarterLoot(player);
    
    // Send existing players to new player
    const otherPlayers = Array.from(gameState.players.values())
      .filter(p => p.room === room && p.id !== socket.id)
      .map(p => p.toJSON());
    socket.emit('other-players', otherPlayers);
    
    // Broadcast new player to others in room
    socket.to(room).emit('player-joined', player.toJSON());
    
    console.log(`Player ${player.username} joined game in room ${room}`);
  });

  // Player movement
  socket.on('player-move', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const { x, y, direction } = data;
    player.position = { x, y };
    player.direction = direction;
    player.lastActivity = Date.now();

    // Broadcast movement to other players in room
    socket.to(player.room).emit('player-moved', {
      playerId: socket.id,
      position: player.position,
      direction: player.direction
    });
  });

  // Activity events (mining, fishing, etc.)
  socket.on('start-activity', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const { activity, position } = data;
    const activityId = `${socket.id}_${Date.now()}`;
    
    gameState.activities.set(activityId, {
      playerId: socket.id,
      activity,
      position,
      startTime: Date.now(),
      duration: 2000 // 2 seconds
    });

    // Broadcast activity start to room
    socket.to(player.room).emit('player-activity-start', {
      playerId: socket.id,
      activity,
      position
    });

    // Complete activity after duration
    setTimeout(() => {
      const activityData = gameState.activities.get(activityId);
      if (activityData) {
        // Award XP and items
        const rewards = calculateActivityRewards(activity);
        player.stats.totalXP += rewards.xp;
        
        gameState.activities.delete(activityId);
        
        // Send rewards to player
        socket.emit('activity-complete', {
          activity,
          rewards
        });
        
        // Broadcast completion to room
        socket.to(player.room).emit('player-activity-complete', {
          playerId: socket.id,
          activity,
          rewards
        });
      }
    }, 2000);
  });

  // Combat system
  socket.on('start-combat', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || player.inCombat) return;

    const { targetType, targetId, position } = data;
    
    if (targetType === 'npc') {
      // Start NPC combat
      const combatId = `combat_${socket.id}_${Date.now()}`;
      const npcStats = generateNPCStats(targetId, player.stats.level);
      
      const combat = {
        id: combatId,
        type: 'npc',
        playerId: socket.id,
        targetType: 'npc',
        targetId,
        playerStats: { ...player.stats },
        npcStats,
        position,
        turn: 'player',
        startTime: Date.now()
      };
      
      gameState.combats.set(combatId, combat);
      player.inCombat = true;
      player.combatTarget = combatId;
      
      socket.emit('combat-started', combat);
      socket.to(player.room).emit('player-combat-start', {
        playerId: socket.id,
        position,
        combat
      });
    }
  });

  // PvP Combat System
  socket.on('challenge-player', (data) => {
    const challenger = gameState.players.get(socket.id);
    if (!challenger) return;

    const { targetPlayerId } = data;
    const targetPlayer = gameState.players.get(targetPlayerId);
    
    if (!targetPlayer) {
      socket.emit('challenge-failed', { reason: 'Player not found' });
      return;
    }
    
    if (targetPlayer.room !== challenger.room) {
      socket.emit('challenge-failed', { reason: 'Player is in a different room' });
      return;
    }

    // Check if challenger is in combat
    if (challenger.inCombat) {
      const challengerCombat = gameState.combats.get(challenger.combatTarget);
      const combatType = challengerCombat?.type === 'pvp' ? 'PvP combat' : 'NPC combat';
      socket.emit('challenge-failed', { reason: `You are already in ${combatType}! Finish your current fight first.` });
      return;
    }

    // Check if target is in combat
    if (targetPlayer.inCombat) {
      const targetCombat = gameState.combats.get(targetPlayer.combatTarget);
      const combatType = targetCombat?.type === 'pvp' ? 'PvP combat' : 'NPC combat';
      socket.emit('challenge-failed', { reason: `${targetPlayer.username} is already in ${combatType}! Wait for them to finish.` });
      return;
    }

    // Create challenge
    const challengeId = `challenge_${socket.id}_${targetPlayerId}_${Date.now()}`;
    const challenge = {
      id: challengeId,
      challengerId: socket.id,
      challengerName: challenger.username,
      targetId: targetPlayerId,
      targetName: targetPlayer.username,
      timestamp: Date.now(),
      status: 'pending'
    };

    // Store challenge
    gameState.challenges = gameState.challenges || new Map();
    gameState.challenges.set(challengeId, challenge);

    // Send challenge to target player
    io.to(targetPlayerId).emit('pvp-challenge-received', {
      challengeId,
      challengerName: challenger.username,
      challengerId: socket.id
    });

    // Confirm challenge sent to challenger
    socket.emit('challenge-sent', {
      challengeId,
      targetName: targetPlayer.username
    });

    console.log(`${challenger.username} challenged ${targetPlayer.username} to PvP combat`);
  });

  socket.on('respond-to-challenge', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || player.inCombat) return;

    const { challengeId, accepted } = data;
    const challenge = gameState.challenges?.get(challengeId);
    
    if (!challenge || challenge.targetId !== socket.id || challenge.status !== 'pending') {
      socket.emit('challenge-response-failed', { reason: 'Invalid challenge' });
      return;
    }

    const challenger = gameState.players.get(challenge.challengerId);
    if (!challenger || challenger.inCombat) {
      socket.emit('challenge-response-failed', { reason: 'Challenger no longer available' });
      gameState.challenges.delete(challengeId);
      return;
    }

    if (accepted) {
      // Start PvP combat
      const combatId = `pvp_${challenge.challengerId}_${socket.id}_${Date.now()}`;
      const pvpCombat = {
        id: combatId,
        type: 'pvp',
        player1: {
          id: challenge.challengerId,
          name: challenger.username,
          stats: { ...challenger.stats },
          ready: false
        },
        player2: {
          id: socket.id,
          name: player.username,
          stats: { ...player.stats },
          ready: false
        },
        turn: challenge.challengerId, // Challenger goes first
        round: 1,
        startTime: Date.now(),
        status: 'active'
      };

      // Set both players as in combat
      challenger.inCombat = true;
      challenger.combatTarget = combatId;
      player.inCombat = true;
      player.combatTarget = combatId;

      // Store combat
      gameState.combats.set(combatId, pvpCombat);

      // Notify both players
      io.to(challenge.challengerId).emit('pvp-combat-started', {
        combat: pvpCombat,
        yourTurn: true,
        opponent: pvpCombat.player2,
        yourStats: pvpCombat.player1.stats,
        opponentStats: pvpCombat.player2.stats
      });

      io.to(socket.id).emit('pvp-combat-started', {
        combat: pvpCombat,
        yourTurn: false,
        opponent: pvpCombat.player1,
        yourStats: pvpCombat.player2.stats,
        opponentStats: pvpCombat.player1.stats
      });

      // Start automatic PvP combat timer
      startAutoPvPCombat(combatId);

      // Broadcast to room
      const room = player.room;
      socket.to(room).emit('pvp-combat-spectate', {
        combatId,
        player1: pvpCombat.player1.name,
        player2: pvpCombat.player2.name
      });

      console.log(`PvP combat started: ${challenger.username} vs ${player.username}`);
    } else {
      // Challenge declined
      io.to(challenge.challengerId).emit('challenge-declined', {
        targetName: player.username
      });
      
      console.log(`${player.username} declined challenge from ${challenger.username}`);
    }

    // Clean up challenge
    gameState.challenges.delete(challengeId);
  });

  // PvP combat is now automatic - no manual combat actions needed

  // Loot pickup system
  socket.on('pickup-loot', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const { lootId, position } = data;
    
    // Check if player is close enough to the loot
    const distance = Math.sqrt(
      Math.pow(player.position.x - position.x, 2) + 
      Math.pow(player.position.y - position.y, 2)
    );
    
    if (distance <= 50) { // Must be within 50 pixels to pick up loot
      // Add loot to player inventory (this would be handled by the client for now)
      socket.emit('loot-pickup-success', { lootId });
      
      // Broadcast to other players that loot was picked up
      socket.to(player.room).emit('loot-picked-up', {
        playerId: socket.id,
        playerName: player.username,
        lootId
      });
      
      console.log(`📦 ${player.username} picked up loot at distance ${Math.floor(distance)}px`);
    } else {
      socket.emit('loot-pickup-failed', { reason: 'Too far away', distance: Math.floor(distance) });
    }
  });

  // Chat system
  socket.on('chat-message', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const { message } = data;
    const chatData = {
      playerId: socket.id,
      username: player.username,
      message,
      timestamp: Date.now()
    };

    // Broadcast to room
    io.to(player.room).emit('chat-message', chatData);
  });

  // Player equipment
  socket.on('equip-weapon', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const { weapon } = data;
    // Validate if weapon is in inventory
    if (player.inventory.some(item => item.name === weapon)) {
      player.equippedWeapon = weapon;
      socket.emit('weapon-equipped', { weapon });
      console.log(`${player.username} equipped ${weapon}`);
    }
  });

  // Player disconnect
  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      // Clean up combat if in progress
      if (player.inCombat) {
        endCombat(socket.id, false);
      }
      
      // Remove from room
      const room = gameState.rooms.get(player.room);
      if (room) {
        room.removePlayer(socket.id);
        
        // If room is empty, clean it up
        if (room.getPlayerCount() === 0) {
          gameState.rooms.delete(player.room);
        }
      }
      
      // Broadcast player left to room
      socket.to(player.room).emit('player-left', socket.id);
      
      // Clean up player data
      gameState.players.delete(socket.id);
      
      console.log(`Player ${player.username} disconnected`);
    }
  });
});

// Helper functions
function calculateActivityRewards(activity) {
  const baseRewards = {
    mining: { xp: 15, items: [{ id: 1, name: 'Rock', quantity: 1 }] },
    fishing: { xp: 12, items: [{ id: 7, name: 'Raw Fish', quantity: 1 }] },
    cooking: { xp: 18, items: [{ id: 8, name: 'Cooked Fish', quantity: 1 }] },
    woodcutting: { xp: 10, items: [{ id: 2, name: 'Wood', quantity: 1 }] }
  };

  return baseRewards[activity] || { xp: 5, items: [] };
}

function generateNPCStats(npcType, playerLevel) {
  const baseStats = {
    goblin: { health: 30, attack: 8, defense: 2, xpReward: 15 },
    orc: { health: 60, attack: 12, defense: 4, xpReward: 25 },
    skeleton: { health: 40, attack: 10, defense: 6, xpReward: 20 }
  };

  const base = baseStats[npcType] || baseStats.goblin;
  const multiplier = 1 + (playerLevel - 1) * 0.2;

  return {
    type: npcType,
    health: Math.floor(base.health * multiplier),
    maxHealth: Math.floor(base.health * multiplier),
    attack: Math.floor(base.attack * multiplier),
    defense: Math.floor(base.defense * multiplier),
    xpReward: Math.floor(base.xpReward * multiplier)
  };
}

function processCombatAction(combat, playerAction) {
  const player = gameState.players.get(combat.playerId);
  if (!player) return;

  // Player attacks NPC
  const playerDamage = Math.max(1, combat.playerStats.attack - combat.npcStats.defense);
  const randomFactor = 0.8 + Math.random() * 0.4;
  const finalDamage = Math.floor(playerDamage * randomFactor);
  
  combat.npcStats.health = Math.max(0, combat.npcStats.health - finalDamage);
  
  let result = {
    playerAction,
    playerDamage: finalDamage,
    npcHealth: combat.npcStats.health,
    combatEnded: false,
    victory: false
  };
  
  // Check if NPC is defeated
  if (combat.npcStats.health <= 0) {
    result.combatEnded = true;
    result.victory = true;
    result.xpGained = combat.npcStats.xpReward;
    return result;
  }
  
  // NPC attacks back
  const npcDamage = Math.max(1, combat.npcStats.attack - combat.playerStats.defense);
  const npcRandomFactor = 0.8 + Math.random() * 0.4;
  const finalNpcDamage = Math.floor(npcDamage * npcRandomFactor);
  
  combat.playerStats.health = Math.max(0, combat.playerStats.health - finalNpcDamage);
  
  result.npcDamage = finalNpcDamage;
  result.playerHealth = combat.playerStats.health;
  
  // Check if player is defeated
  if (combat.playerStats.health <= 0) {
    result.combatEnded = true;
    result.victory = false;
  }
  
  return result;
}

function processPvPCombatAction(combat, playerId, action) {
  // Check if it's the player's turn
  if (combat.turn !== playerId) {
    return null; // Not your turn
  }

  const isPlayer1 = combat.player1.id === playerId;
  const attacker = isPlayer1 ? combat.player1 : combat.player2;
  const defender = isPlayer1 ? combat.player2 : combat.player1;

  let damage = 0;
  let actionResult = '';

  // Calculate action effects
  switch (action) {
    case 'attack':
      damage = Math.max(1, attacker.stats.attack - defender.stats.defense + Math.floor(Math.random() * 5));
      defender.stats.health -= damage;
      actionResult = `${attacker.name} attacks ${defender.name} for ${damage} damage!`;
      break;
      
    case 'defend':
      // Reduce incoming damage for next turn and heal slightly
      const healAmount = Math.floor(attacker.stats.maxHealth * 0.1);
      attacker.stats.health = Math.min(attacker.stats.maxHealth, attacker.stats.health + healAmount);
      attacker.defendingNextTurn = true;
      actionResult = `${attacker.name} defends and recovers ${healAmount} health!`;
      break;
      
    case 'trick':
      // Chance to deal extra damage or confuse opponent
      const trickSuccess = Math.random() > 0.5;
      if (trickSuccess) {
        damage = Math.floor(attacker.stats.attack * 1.5);
        defender.stats.health -= damage;
        actionResult = `${attacker.name} tricks ${defender.name} for ${damage} damage!`;
      } else {
        actionResult = `${attacker.name}'s trick failed!`;
      }
      break;
  }

  // Check if defender was defending last turn
  if (defender.defendingNextTurn && action === 'attack') {
    damage = Math.floor(damage * 0.5);
    defender.stats.health += Math.floor(damage * 0.5); // Partial heal from blocked damage
    actionResult += ` (Damage reduced by defense!)`;
    defender.defendingNextTurn = false;
  }

  // Ensure health doesn't go below 0
  defender.stats.health = Math.max(0, defender.stats.health);

  // Check for combat end
  const combatEnded = defender.stats.health <= 0;
  let winnerId = null;
  
  if (combatEnded) {
    winnerId = attacker.id;
    actionResult += ` ${defender.name} is defeated!`;
  } else {
    // Switch turns
    combat.turn = defender.id;
    combat.round++;
  }

  return {
    action,
    attackerName: attacker.name,
    defenderName: defender.name,
    damage,
    actionResult,
    combatEnded,
    winnerId,
    round: combat.round
  };
}

function endPvPCombat(combatId, winnerId) {
  const combat = gameState.combats.get(combatId);
  if (!combat) return;

  const player1 = gameState.players.get(combat.player1.id);
  const player2 = gameState.players.get(combat.player2.id);
  
  if (player1) {
    player1.inCombat = false;
    player1.combatTarget = null;
    
    // Award XP to winner, reset health
    if (winnerId === player1.id) {
      player1.stats.totalXP += 50; // PvP victory XP
    } else {
      player1.stats.health = player1.stats.maxHealth; // Reset health on defeat
    }
  }
  
  if (player2) {
    player2.inCombat = false;
    player2.combatTarget = null;
    
    // Award XP to winner, reset health
    if (winnerId === player2.id) {
      player2.stats.totalXP += 50; // PvP victory XP
    } else {
      player2.stats.health = player2.stats.maxHealth; // Reset health on defeat
    }
  }

  // Clean up combat
  gameState.combats.delete(combatId);

  // Notify both players
  const winnerName = winnerId === combat.player1.id ? combat.player1.name : combat.player2.name;
  
  if (player1) {
    const player1Socket = io.sockets.sockets.get(player1.id);
    if (player1Socket) {
      player1Socket.emit('pvp-combat-ended', {
        victory: winnerId === player1.id,
        winnerName,
        xpGained: winnerId === player1.id ? 50 : 0
      });
    }
  }
  
  if (player2) {
    const player2Socket = io.sockets.sockets.get(player2.id);
    if (player2Socket) {
      player2Socket.emit('pvp-combat-ended', {
        victory: winnerId === player2.id,
        winnerName,
        xpGained: winnerId === player2.id ? 50 : 0
      });
    }
  }

  // Broadcast to spectators
  if (player1 && player2) {
    const room = player1.room;
    io.to(room).emit('pvp-combat-spectate-ended', {
      combatId,
      winnerName,
      player1Name: combat.player1.name,
      player2Name: combat.player2.name
    });
  }

  console.log(`PvP combat ended: ${winnerName} defeated ${winnerId === combat.player1.id ? combat.player2.name : combat.player1.name}`);
}

function endCombat(playerId, victory) {
  const player = gameState.players.get(playerId);
  if (!player) return;

  const combat = gameState.combats.get(player.combatTarget);
  if (combat) {
    if (victory) {
      // Award XP
      player.stats.totalXP += combat.npcStats.xpReward;
    } else {
      // Reset health on defeat
      player.stats.health = player.stats.maxHealth;
    }
    
    gameState.combats.delete(player.combatTarget);
  }
  
  player.inCombat = false;
  player.combatTarget = null;
  
  // Broadcast combat end
  io.to(player.room).emit('player-combat-end', {
    playerId,
    victory
  });
}

// Server status endpoint
app.get('/status', (req, res) => {
  res.json({
    players: gameState.players.size,
    rooms: gameState.rooms.size,
    activities: gameState.activities.size,
    combats: gameState.combats.size,
    uptime: process.uptime()
  });
});

// Auto PvP Combat System
function startAutoPvPCombat(combatId) {
  const combat = gameState.combats.get(combatId);
  if (!combat) return;

  // Combat happens every 2 seconds
  const combatInterval = setInterval(() => {
    const updatedCombat = gameState.combats.get(combatId);
    if (!updatedCombat || updatedCombat.status !== 'active') {
      clearInterval(combatInterval);
      return;
    }

    // Perform automatic attack
    const result = performAutoPvPAttack(updatedCombat);
    
    if (result) {
      // Update combat state
      gameState.combats.set(combatId, updatedCombat);
      
      // Send updates to both players
      const player1 = gameState.players.get(updatedCombat.player1.id);
      const player2 = gameState.players.get(updatedCombat.player2.id);
      
      if (player1) {
        io.to(updatedCombat.player1.id).emit('pvp-combat-update', {
          ...result,
          yourTurn: updatedCombat.turn === updatedCombat.player1.id,
          yourStats: updatedCombat.player1.stats,
          opponentStats: updatedCombat.player2.stats
        });
      }
      
      if (player2) {
        io.to(updatedCombat.player2.id).emit('pvp-combat-update', {
          ...result,
          yourTurn: updatedCombat.turn === updatedCombat.player2.id,
          yourStats: updatedCombat.player2.stats,
          opponentStats: updatedCombat.player1.stats
        });
      }
      
      // Check if combat ended
      if (result.combatEnded) {
        clearInterval(combatInterval);
        endPvPCombat(combatId, result.winnerId);
      }
    }
  }, 2000); // Attack every 2 seconds
}

function performAutoPvPAttack(combat) {
  const isPlayer1Turn = combat.turn === combat.player1.id;
  const attacker = isPlayer1Turn ? combat.player1 : combat.player2;
  const defender = isPlayer1Turn ? combat.player2 : combat.player1;

  // Get actual player objects from game state to check positions
  const attackerPlayer = gameState.players.get(attacker.id);
  const defenderPlayer = gameState.players.get(defender.id);
  
  if (!attackerPlayer || !defenderPlayer) {
    return null; // Players not found
  }

  // Check distance between players (must be within range for damage to register)
  const distance = Math.sqrt(
    Math.pow(attackerPlayer.position.x - defenderPlayer.position.x, 2) + 
    Math.pow(attackerPlayer.position.y - defenderPlayer.position.y, 2)
  );
  
  let maxCombatRange = 100; // Default for melee
  let isRanged = false;
  if (attackerPlayer.equippedWeapon === 'bow') {
    maxCombatRange = 300;
    isRanged = true;
  }
  
  let damage = 0;
  let actionResult = '';
  
  if (distance <= maxCombatRange) {
    // Players are close enough for combat
    const baseDamage = attacker.stats.attack;
    
    // Apply weapon-specific damage modifiers
    let weaponModifier = 1.0;
    if (attackerPlayer.equippedWeapon === 'bow') {
      weaponModifier = 0.7; // Bow does 70% damage (weaker but has range)
    } else if (attackerPlayer.equippedWeapon === 'bronze_sword') {
      weaponModifier = 1.2; // Sword does 120% damage (stronger but melee only)
    }
    
    const randomFactor = 0.8 + Math.random() * 0.4; // 80-120% of base damage
    damage = Math.floor(baseDamage * weaponModifier * randomFactor);
    
    // Apply damage
    defender.stats.health = Math.max(0, defender.stats.health - damage);
    
    const weaponName = attackerPlayer.equippedWeapon === 'bow' ? 'bow' : 'sword';
    actionResult = `${attacker.name} attacks ${defender.name} with ${weaponName} for ${damage} damage!`;
  } else {
    // Players are too far apart
    actionResult = `${attacker.name} swings at ${defender.name} but they're too far away! (Distance: ${Math.floor(distance)}px)`;
  }
  
  // Check if defender is defeated
  const combatEnded = defender.stats.health <= 0;
  let winnerId = null;
  
  if (combatEnded) {
    winnerId = attacker.id;
    combat.status = 'ended';
    
    // Handle loot dropping when player dies
    handlePlayerDeath(defender.id, attacker.id);
  } else {
    // Switch turns
    combat.turn = defender.id;
    combat.round++;
  }

  return {
    action: 'attack',
    attackerName: attacker.name,
    defenderName: defender.name,
    damage,
    actionResult,
    combatEnded,
    winnerId,
    round: combat.round,
    distance: Math.floor(distance),
    isRanged
  };
}

// Player death and respawn system
function handlePlayerDeath(deadPlayerId, winnerId) {
  const deadPlayer = gameState.players.get(deadPlayerId);
  const winnerPlayer = gameState.players.get(winnerId);
  
  if (!deadPlayer || !winnerPlayer) {
    console.error('Player not found during death handling');
    return;
  }

  console.log(`💀 ${deadPlayer.username} died! Dropping loot and respawning at center`);

  // Create loot drops from dead player's inventory
  const lootDrops = [];
  
  // Add some random loot to make it interesting
  if (deadPlayer.inventory.length === 0) {
    // Give new players some starter loot
    addStarterLoot(deadPlayer);
  }

  // Drop all of the dead player's inventory except weapons
  deadPlayer.inventory.forEach(item => {
    if (item.name !== 'bronze_sword' && item.name !== 'bow') {
      lootDrops.push({
        id: item.id,
        name: item.name,
        rarity: item.rarity || 'Common',
        value: item.value || 10,
        quantity: item.quantity || 1
      });
    }
  });

  // Clear dead player's inventory except weapons
  deadPlayer.inventory = deadPlayer.inventory.filter(item => 
    item.name === 'bronze_sword' || item.name === 'bow'
  );
  
  // Reset both players' health to full
  deadPlayer.stats.health = deadPlayer.stats.maxHealth;
  winnerPlayer.stats.health = winnerPlayer.stats.maxHealth;
  
  // Respawn dead player in center of map
  const centerPosition = { x: 800, y: 600 };
  deadPlayer.position = centerPosition;

  // Broadcast loot drop to room if there's loot
  if (lootDrops.length > 0) {
    io.to(deadPlayer.room).emit('player-loot-dropped', {
      deadPlayerId,
      winnerPlayerId: winnerId,
      deadPlayerName: deadPlayer.username,
      winnerPlayerName: winnerPlayer.username,
      position: deadPlayer.position,
      loot: lootDrops
    });

    console.log(`💰 Dropped ${lootDrops.length} items:`, lootDrops.map(l => l.name));
  }

  // Broadcast respawn to room
  io.to(deadPlayer.room).emit('player-respawned', {
    deadPlayerId,
    winnerPlayerId: winnerId,
    deadPlayerName: deadPlayer.username,
    winnerPlayerName: winnerPlayer.username,
    newPosition: centerPosition
  });

  // Send updated positions to both players
  io.to(deadPlayerId).emit('player-moved', {
    playerId: deadPlayerId,
    position: centerPosition
  });

  // Broadcast position update to other players in room
  io.to(deadPlayer.room).emit('player-moved', {
    playerId: deadPlayerId,
    position: centerPosition
  });

  console.log(`🔄 ${deadPlayer.username} respawned at center with full health, both players healed`);
}

function addStarterLoot(player) {
  // Add some starter loot to make PvP more interesting
  const starterItems = [
    { id: 201, name: 'bronze_sword', rarity: 'Common', value: 15, quantity: 1 },
    { id: 202, name: 'bow', rarity: 'Common', value: 20, quantity: 1 },
    { id: 203, name: 'arrows', rarity: 'Common', value: 1, quantity: 100 },
  ];

  // Add all starter items
  starterItems.forEach(item => {
    player.inventory.push({ ...item });
  });

  console.log(`🎒 Added starter loot to ${player.username}:`, player.inventory.map(i => i.name));
}

// Give all existing players some starter loot
function initializePlayerInventories() {
  gameState.players.forEach(player => {
    if (player.inventory.length === 0) {
      addStarterLoot(player);
    }
  });
}

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🎮 Multiplayer server running on ${HOST}:${PORT}`);
  console.log(`🔗 Game client should connect to ${process.env.NODE_ENV === 'production' ? 'wss://your-server-domain.com' : `http://localhost:${PORT}`}`);
  console.log(`📊 Status endpoint: ${process.env.NODE_ENV === 'production' ? 'https://your-server-domain.com/status' : `http://localhost:${PORT}/status`}`);
  console.log(`💚 Health check: ${process.env.NODE_ENV === 'production' ? 'https://your-server-domain.com/health' : `http://localhost:${PORT}/health`}`);
  
  // Initialize existing players with starter loot
  initializePlayerInventories();
}); 