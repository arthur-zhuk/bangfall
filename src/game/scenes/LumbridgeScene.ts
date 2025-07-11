import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class LumbridgeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private goblins!: Phaser.Physics.Arcade.Group;
  
  // Activity areas - now using sprites instead of rectangles
  private miningArea!: Phaser.GameObjects.Sprite;
  private fishingArea!: Phaser.GameObjects.Sprite;
  private cookingArea!: Phaser.GameObjects.Sprite;
  private woodcuttingArea!: Phaser.GameObjects.Sprite;
  
  // Interactive objects
  private interactiveObjects!: Phaser.Physics.Arcade.Group;
  
  // Combat system
  private isInCombat = false;
  private playerStats = {
    health: 100,
    maxHealth: 100,
    attack: 8,
    defense: 2
  };
  private currentEnemy: Phaser.Physics.Arcade.Sprite | null = null;
  private combatTimer: Phaser.Time.TimerEvent | null = null;
  private playerTurn = true;
  private combatUI!: Phaser.GameObjects.Container;
  
  // Activity status
  private statusText!: Phaser.GameObjects.Text;
  private activityInProgress = false;
  
  // Player direction for proper sprite orientation
  private playerDirection = 'down';
  
  // Click-to-move system
  private targetPosition: { x: number; y: number } | null = null;
  private moveSpeed = 160;
  private moveTween: Phaser.Tweens.Tween | null = null;
  private moveTargetIndicator: Phaser.GameObjects.Image | null = null;

  constructor() {
    super({ key: 'LumbridgeScene' });
  }

  preload() {
    // Create animated player sprite (human character)
    this.createPlayerSprites();
    
    // Create animated goblin sprite
    this.createGoblinSprites();
    
    // Create environment sprites
    this.createEnvironmentSprites();
    
    // Create interactive object sprites
    this.createInteractiveSprites();
  }

  private createPlayerSprites() {
    // Create directional sprites for the player
    this.createPlayerSpriteForDirection('down');   // Default/front view
    this.createPlayerSpriteForDirection('up');     // Back view
    this.createPlayerSpriteForDirection('left');   // Left side view
    this.createPlayerSpriteForDirection('right');  // Right side view
    this.createPlayerSpriteForDirection('down_left');  // Diagonal down-left
    this.createPlayerSpriteForDirection('down_right'); // Diagonal down-right
    this.createPlayerSpriteForDirection('up_left');    // Diagonal up-left
    this.createPlayerSpriteForDirection('up_right');   // Diagonal up-right
  }

  private createPlayerSpriteForDirection(direction: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;  // Increased size for more detail
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.clearRect(0, 0, 48, 48);
    
    // Enhanced colors with gradients and shadows
    const skinColor = '#FFDDAA';
    const skinShadow = '#E6C088';
    const hairColor = '#8B4513';  // Brown hair
    const hairHighlight = '#CD853F';
    const shirtColor = '#4A90E2';
    const shirtShadow = '#2E5A8A';
    const pantsColor = '#2F4F4F';
    const pantsHighlight = '#708090';
    const shoeColor = '#8B4513';
    const eyeColor = '#000000';
    const eyeWhite = '#FFFFFF';
    
    // Helper function to draw circles
    const drawCircle = (x: number, y: number, radius: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    };
    
    // Helper function to draw rectangles with rounded corners
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    };
    
    switch (direction) {
      case 'down': // Front view (default) - most detailed
        // Head (with gradient)
        ctx.fillStyle = skinColor;
        drawCircle(24, 12, 8, skinColor);
        // Head shadow
        ctx.fillStyle = skinShadow;
        drawCircle(26, 14, 6, skinShadow);
        // Head highlight
        ctx.fillStyle = skinColor;
        drawCircle(22, 10, 6, skinColor);
        
        // Hair (detailed with highlights)
        ctx.fillStyle = hairColor;
        drawRoundedRect(16, 4, 16, 10, 8, hairColor);
        // Hair highlights
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(18, 6, 4, 6, 2, hairHighlight);
        drawRoundedRect(26, 6, 4, 6, 2, hairHighlight);
        
        // Eyes (detailed)
        ctx.fillStyle = eyeWhite;
        drawCircle(21, 10, 2, eyeWhite);
        drawCircle(27, 10, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(21, 10, 1, eyeColor);
        drawCircle(27, 10, 1, eyeColor);
        
        // Nose (small)
        ctx.fillStyle = skinShadow;
        drawCircle(24, 12, 1, skinShadow);
        
        // Mouth
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(24, 14, 2, 0, Math.PI);
        ctx.stroke();
        
        // Neck
        ctx.fillStyle = skinColor;
        drawRoundedRect(21, 18, 6, 4, 2, skinColor);
        
        // Body (shirt with shading)
        ctx.fillStyle = shirtShadow;
        drawRoundedRect(16, 22, 16, 12, 4, shirtShadow);
        ctx.fillStyle = shirtColor;
        drawRoundedRect(17, 23, 14, 10, 3, shirtColor);
        
        // Arms (with muscle definition)
        ctx.fillStyle = skinShadow;
        drawRoundedRect(10, 24, 6, 10, 3, skinShadow);
        drawRoundedRect(32, 24, 6, 10, 3, skinShadow);
        ctx.fillStyle = skinColor;
        drawRoundedRect(11, 25, 4, 8, 2, skinColor);
        drawRoundedRect(33, 25, 4, 8, 2, skinColor);
        
        // Hands
        drawCircle(13, 34, 2, skinColor);
        drawCircle(35, 34, 2, skinColor);
        
        // Pants (with shading)
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        ctx.fillStyle = pantsHighlight;
        drawRoundedRect(18, 35, 12, 2, 1, pantsHighlight);
        
        // Legs
        ctx.fillStyle = pantsColor;
        drawRoundedRect(18, 42, 5, 6, 2, pantsColor);
        drawRoundedRect(25, 42, 5, 6, 2, pantsColor);
        
        // Shoes
        ctx.fillStyle = shoeColor;
        drawRoundedRect(17, 46, 7, 2, 1, shoeColor);
        drawRoundedRect(24, 46, 7, 2, 1, shoeColor);
        break;
        
      case 'up': // Back view
        // Head (back of head)
        ctx.fillStyle = skinColor;
        drawCircle(24, 12, 8, skinColor);
        
        // Hair (more visible from back)
        ctx.fillStyle = hairColor;
        drawRoundedRect(14, 4, 20, 12, 10, hairColor);
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(16, 6, 6, 8, 3, hairHighlight);
        drawRoundedRect(26, 6, 6, 8, 3, hairHighlight);
        
        // Neck
        ctx.fillStyle = skinColor;
        drawRoundedRect(21, 18, 6, 4, 2, skinColor);
        
        // Body (shirt back)
        ctx.fillStyle = shirtShadow;
        drawRoundedRect(16, 22, 16, 12, 4, shirtShadow);
        ctx.fillStyle = shirtColor;
        drawRoundedRect(17, 23, 14, 10, 3, shirtColor);
        
        // Arms (back view)
        ctx.fillStyle = skinShadow;
        drawRoundedRect(10, 24, 6, 10, 3, skinShadow);
        drawRoundedRect(32, 24, 6, 10, 3, skinShadow);
        ctx.fillStyle = skinColor;
        drawRoundedRect(11, 25, 4, 8, 2, skinColor);
        drawRoundedRect(33, 25, 4, 8, 2, skinColor);
        
        // Hands
        drawCircle(13, 34, 2, skinColor);
        drawCircle(35, 34, 2, skinColor);
        
        // Pants
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        
        // Legs
        ctx.fillStyle = pantsColor;
        drawRoundedRect(18, 42, 5, 6, 2, pantsColor);
        drawRoundedRect(25, 42, 5, 6, 2, pantsColor);
        
        // Shoes
        ctx.fillStyle = shoeColor;
        drawRoundedRect(17, 46, 7, 2, 1, shoeColor);
        drawRoundedRect(24, 46, 7, 2, 1, shoeColor);
        break;
        
      case 'left': // Left side view
        // Head (profile)
        ctx.fillStyle = skinColor;
        drawCircle(20, 12, 8, skinColor);
        
        // Hair (side profile)
        ctx.fillStyle = hairColor;
        drawRoundedRect(12, 4, 16, 10, 8, hairColor);
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(14, 6, 4, 6, 2, hairHighlight);
        
        // Eye (profile view)
        ctx.fillStyle = eyeWhite;
        drawCircle(18, 10, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(17, 10, 1, eyeColor);
        
        // Nose (profile)
        ctx.fillStyle = skinShadow;
        drawRoundedRect(12, 11, 3, 2, 1, skinShadow);
        
        // Mouth (profile)
        ctx.fillStyle = '#8B4513';
        drawRoundedRect(13, 14, 2, 1, 1, '#8B4513');
        
        // Neck
        ctx.fillStyle = skinColor;
        drawRoundedRect(18, 18, 6, 4, 2, skinColor);
        
        // Body (side view)
        ctx.fillStyle = shirtShadow;
        drawRoundedRect(16, 22, 16, 12, 4, shirtShadow);
        ctx.fillStyle = shirtColor;
        drawRoundedRect(17, 23, 14, 10, 3, shirtColor);
        
        // Arms (side view - one visible, one behind)
        ctx.fillStyle = skinShadow;
        drawRoundedRect(8, 24, 6, 10, 3, skinShadow);
        ctx.fillStyle = skinColor;
        drawRoundedRect(9, 25, 4, 8, 2, skinColor);
        
        // Hand
        drawCircle(11, 34, 2, skinColor);
        
        // Pants
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        
        // Legs (side view)
        ctx.fillStyle = pantsColor;
        drawRoundedRect(18, 42, 8, 6, 2, pantsColor);
        
        // Shoe
        ctx.fillStyle = shoeColor;
        drawRoundedRect(16, 46, 10, 2, 1, shoeColor);
        break;
        
      case 'right': // Right side view
        // Head (profile)
        ctx.fillStyle = skinColor;
        drawCircle(28, 12, 8, skinColor);
        
        // Hair (side profile)
        ctx.fillStyle = hairColor;
        drawRoundedRect(20, 4, 16, 10, 8, hairColor);
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(30, 6, 4, 6, 2, hairHighlight);
        
        // Eye (profile view)
        ctx.fillStyle = eyeWhite;
        drawCircle(30, 10, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(31, 10, 1, eyeColor);
        
        // Nose (profile)
        ctx.fillStyle = skinShadow;
        drawRoundedRect(33, 11, 3, 2, 1, skinShadow);
        
        // Mouth (profile)
        ctx.fillStyle = '#8B4513';
        drawRoundedRect(33, 14, 2, 1, 1, '#8B4513');
        
        // Neck
        ctx.fillStyle = skinColor;
        drawRoundedRect(24, 18, 6, 4, 2, skinColor);
        
        // Body (side view)
        ctx.fillStyle = shirtShadow;
        drawRoundedRect(16, 22, 16, 12, 4, shirtShadow);
        ctx.fillStyle = shirtColor;
        drawRoundedRect(17, 23, 14, 10, 3, shirtColor);
        
        // Arms (side view - one visible, one behind)
        ctx.fillStyle = skinShadow;
        drawRoundedRect(34, 24, 6, 10, 3, skinShadow);
        ctx.fillStyle = skinColor;
        drawRoundedRect(35, 25, 4, 8, 2, skinColor);
        
        // Hand
        drawCircle(37, 34, 2, skinColor);
        
        // Pants
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        
        // Legs (side view)
        ctx.fillStyle = pantsColor;
        drawRoundedRect(22, 42, 8, 6, 2, pantsColor);
        
        // Shoe
        ctx.fillStyle = shoeColor;
        drawRoundedRect(22, 46, 10, 2, 1, shoeColor);
        break;
        
      case 'down_left': // Diagonal down-left
        // Head
        ctx.fillStyle = skinColor;
        drawCircle(22, 12, 8, skinColor);
        
        // Hair
        ctx.fillStyle = hairColor;
        drawRoundedRect(14, 4, 16, 10, 8, hairColor);
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(16, 6, 4, 6, 2, hairHighlight);
        
        // Eyes (3/4 view)
        ctx.fillStyle = eyeWhite;
        drawCircle(19, 10, 2, eyeWhite);
        drawCircle(25, 10, 1.5, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(19, 10, 1, eyeColor);
        drawCircle(25, 10, 0.8, eyeColor);
        
        // Nose
        ctx.fillStyle = skinShadow;
        drawCircle(22, 12, 1, skinShadow);
        
        // Body and limbs (diagonal positioning)
        ctx.fillStyle = shirtColor;
        drawRoundedRect(16, 22, 16, 12, 4, shirtColor);
        
        // Arms (diagonal)
        ctx.fillStyle = skinColor;
        drawRoundedRect(8, 24, 6, 10, 3, skinColor);
        drawRoundedRect(30, 26, 6, 8, 3, skinColor);
        
        // Pants
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        
        // Legs
        ctx.fillStyle = pantsColor;
        drawRoundedRect(18, 42, 5, 6, 2, pantsColor);
        drawRoundedRect(25, 42, 5, 6, 2, pantsColor);
        
        // Shoes
        ctx.fillStyle = shoeColor;
        drawRoundedRect(17, 46, 7, 2, 1, shoeColor);
        drawRoundedRect(24, 46, 7, 2, 1, shoeColor);
        break;
        
      case 'down_right': // Diagonal down-right
        // Head
        ctx.fillStyle = skinColor;
        drawCircle(26, 12, 8, skinColor);
        
        // Hair
        ctx.fillStyle = hairColor;
        drawRoundedRect(18, 4, 16, 10, 8, hairColor);
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(28, 6, 4, 6, 2, hairHighlight);
        
        // Eyes (3/4 view)
        ctx.fillStyle = eyeWhite;
        drawCircle(23, 10, 1.5, eyeWhite);
        drawCircle(29, 10, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(23, 10, 0.8, eyeColor);
        drawCircle(29, 10, 1, eyeColor);
        
        // Nose
        ctx.fillStyle = skinShadow;
        drawCircle(26, 12, 1, skinShadow);
        
        // Body and limbs (diagonal positioning)
        ctx.fillStyle = shirtColor;
        drawRoundedRect(16, 22, 16, 12, 4, shirtColor);
        
        // Arms (diagonal)
        ctx.fillStyle = skinColor;
        drawRoundedRect(12, 26, 6, 8, 3, skinColor);
        drawRoundedRect(34, 24, 6, 10, 3, skinColor);
        
        // Pants
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        
        // Legs
        ctx.fillStyle = pantsColor;
        drawRoundedRect(18, 42, 5, 6, 2, pantsColor);
        drawRoundedRect(25, 42, 5, 6, 2, pantsColor);
        
        // Shoes
        ctx.fillStyle = shoeColor;
        drawRoundedRect(17, 46, 7, 2, 1, shoeColor);
        drawRoundedRect(24, 46, 7, 2, 1, shoeColor);
        break;
        
      case 'up_left': // Diagonal up-left
        // Head (back-side view)
        ctx.fillStyle = skinColor;
        drawCircle(22, 12, 8, skinColor);
        
        // Hair (back-side view)
        ctx.fillStyle = hairColor;
        drawRoundedRect(14, 4, 18, 12, 9, hairColor);
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(16, 6, 6, 8, 3, hairHighlight);
        
        // Body (back-diagonal)
        ctx.fillStyle = shirtColor;
        drawRoundedRect(16, 22, 16, 12, 4, shirtColor);
        
        // Arms (back-diagonal)
        ctx.fillStyle = skinColor;
        drawRoundedRect(8, 24, 6, 10, 3, skinColor);
        drawRoundedRect(30, 26, 6, 8, 3, skinColor);
        
        // Pants
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        
        // Legs
        ctx.fillStyle = pantsColor;
        drawRoundedRect(18, 42, 5, 6, 2, pantsColor);
        drawRoundedRect(25, 42, 5, 6, 2, pantsColor);
        
        // Shoes
        ctx.fillStyle = shoeColor;
        drawRoundedRect(17, 46, 7, 2, 1, shoeColor);
        drawRoundedRect(24, 46, 7, 2, 1, shoeColor);
        break;
        
      case 'up_right': // Diagonal up-right
        // Head (back-side view)
        ctx.fillStyle = skinColor;
        drawCircle(26, 12, 8, skinColor);
        
        // Hair (back-side view)
        ctx.fillStyle = hairColor;
        drawRoundedRect(16, 4, 18, 12, 9, hairColor);
        ctx.fillStyle = hairHighlight;
        drawRoundedRect(26, 6, 6, 8, 3, hairHighlight);
        
        // Body (back-diagonal)
        ctx.fillStyle = shirtColor;
        drawRoundedRect(16, 22, 16, 12, 4, shirtColor);
        
        // Arms (back-diagonal)
        ctx.fillStyle = skinColor;
        drawRoundedRect(12, 26, 6, 8, 3, skinColor);
        drawRoundedRect(34, 24, 6, 10, 3, skinColor);
        
        // Pants
        ctx.fillStyle = pantsColor;
        drawRoundedRect(17, 34, 14, 8, 2, pantsColor);
        
        // Legs
        ctx.fillStyle = pantsColor;
        drawRoundedRect(18, 42, 5, 6, 2, pantsColor);
        drawRoundedRect(25, 42, 5, 6, 2, pantsColor);
        
        // Shoes
        ctx.fillStyle = shoeColor;
        drawRoundedRect(17, 46, 7, 2, 1, shoeColor);
        drawRoundedRect(24, 46, 7, 2, 1, shoeColor);
        break;
    }
    
    // Add the canvas as a texture with direction suffix
    this.textures.addCanvas(`player_sprite_${direction}`, canvas);
  }

  private createGoblinSprites() {
    // Create directional sprites for goblins
    this.createGoblinSpriteForDirection('down');
    this.createGoblinSpriteForDirection('up');
    this.createGoblinSpriteForDirection('left');
    this.createGoblinSpriteForDirection('right');
    this.createGoblinSpriteForDirection('down_left');
    this.createGoblinSpriteForDirection('down_right');
    this.createGoblinSpriteForDirection('up_left');
    this.createGoblinSpriteForDirection('up_right');
  }

  private createGoblinSpriteForDirection(direction: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 40;  // Smaller than player but still detailed
    canvas.height = 40;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.clearRect(0, 0, 40, 40);
    
    // Goblin colors
    const skinColor = '#8FBC8F';  // Pale green
    const skinShadow = '#556B2F';  // Darker green
    const eyeColor = '#FF0000';    // Red eyes
    const eyeWhite = '#FFFFFF';
    const teethColor = '#FFFACD';  // Yellowish teeth
    const clothColor = '#8B4513';  // Brown rags
    const clothShadow = '#654321';
    
    // Helper functions
    const drawCircle = (x: number, y: number, radius: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    };
    
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    };
    
    switch (direction) {
      case 'down': // Front view
        // Head (larger, more goblin-like)
        ctx.fillStyle = skinColor;
        drawCircle(20, 10, 7, skinColor);
        ctx.fillStyle = skinShadow;
        drawCircle(22, 12, 5, skinShadow);
        
        // Large pointed ears
        ctx.fillStyle = skinColor;
        drawRoundedRect(8, 8, 4, 6, 2, skinColor);
        drawRoundedRect(28, 8, 4, 6, 2, skinColor);
        
        // Evil red eyes
        ctx.fillStyle = eyeWhite;
        drawCircle(17, 9, 2, eyeWhite);
        drawCircle(23, 9, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(17, 9, 1.5, eyeColor);
        drawCircle(23, 9, 1.5, eyeColor);
        
        // Large nose
        ctx.fillStyle = skinShadow;
        drawRoundedRect(19, 11, 2, 3, 1, skinShadow);
        
        // Menacing grin with teeth
        ctx.fillStyle = '#000000';
        drawRoundedRect(17, 13, 6, 2, 1, '#000000');
        ctx.fillStyle = teethColor;
        drawRoundedRect(18, 13, 1, 2, 0.5, teethColor);
        drawRoundedRect(20, 13, 1, 2, 0.5, teethColor);
        drawRoundedRect(22, 13, 1, 2, 0.5, teethColor);
        
        // Scrawny neck
        ctx.fillStyle = skinColor;
        drawRoundedRect(18, 16, 4, 3, 1, skinColor);
        
        // Ragged clothing
        ctx.fillStyle = clothShadow;
        drawRoundedRect(14, 19, 12, 10, 3, clothShadow);
        ctx.fillStyle = clothColor;
        drawRoundedRect(15, 20, 10, 8, 2, clothColor);
        
        // Thin arms
        ctx.fillStyle = skinColor;
        drawRoundedRect(9, 21, 4, 8, 2, skinColor);
        drawRoundedRect(27, 21, 4, 8, 2, skinColor);
        
        // Clawed hands
        ctx.fillStyle = skinShadow;
        drawCircle(11, 29, 1.5, skinShadow);
        drawCircle(29, 29, 1.5, skinShadow);
        
        // Legs
        ctx.fillStyle = clothColor;
        drawRoundedRect(16, 29, 3, 8, 1, clothColor);
        drawRoundedRect(21, 29, 3, 8, 1, clothColor);
        
        // Bare feet
        ctx.fillStyle = skinColor;
        drawRoundedRect(15, 37, 5, 2, 1, skinColor);
        drawRoundedRect(20, 37, 5, 2, 1, skinColor);
        break;
        
      case 'up': // Back view
        // Head (back)
        ctx.fillStyle = skinColor;
        drawCircle(20, 10, 7, skinColor);
        
        // Ears from back
        ctx.fillStyle = skinColor;
        drawRoundedRect(8, 8, 4, 6, 2, skinColor);
        drawRoundedRect(28, 8, 4, 6, 2, skinColor);
        
        // Neck
        ctx.fillStyle = skinColor;
        drawRoundedRect(18, 16, 4, 3, 1, skinColor);
        
        // Clothing (back)
        ctx.fillStyle = clothShadow;
        drawRoundedRect(14, 19, 12, 10, 3, clothShadow);
        ctx.fillStyle = clothColor;
        drawRoundedRect(15, 20, 10, 8, 2, clothColor);
        
        // Arms
        ctx.fillStyle = skinColor;
        drawRoundedRect(9, 21, 4, 8, 2, skinColor);
        drawRoundedRect(27, 21, 4, 8, 2, skinColor);
        
        // Hands
        ctx.fillStyle = skinShadow;
        drawCircle(11, 29, 1.5, skinShadow);
        drawCircle(29, 29, 1.5, skinShadow);
        
        // Legs
        ctx.fillStyle = clothColor;
        drawRoundedRect(16, 29, 3, 8, 1, clothColor);
        drawRoundedRect(21, 29, 3, 8, 1, clothColor);
        
        // Feet
        ctx.fillStyle = skinColor;
        drawRoundedRect(15, 37, 5, 2, 1, skinColor);
        drawRoundedRect(20, 37, 5, 2, 1, skinColor);
        break;
        
      case 'left': // Left side view
        // Head (profile)
        ctx.fillStyle = skinColor;
        drawCircle(18, 10, 7, skinColor);
        
        // Pointed ear
        ctx.fillStyle = skinColor;
        drawRoundedRect(8, 8, 4, 6, 2, skinColor);
        
        // Eye (profile)
        ctx.fillStyle = eyeWhite;
        drawCircle(16, 9, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(15, 9, 1.5, eyeColor);
        
        // Hooked nose
        ctx.fillStyle = skinShadow;
        drawRoundedRect(10, 11, 4, 2, 1, skinShadow);
        
        // Mouth with teeth
        ctx.fillStyle = '#000000';
        drawRoundedRect(11, 13, 3, 2, 1, '#000000');
        ctx.fillStyle = teethColor;
        drawRoundedRect(12, 13, 1, 2, 0.5, teethColor);
        
        // Body (side view)
        ctx.fillStyle = clothColor;
        drawRoundedRect(14, 19, 12, 10, 3, clothColor);
        
        // Arms (side view)
        ctx.fillStyle = skinColor;
        drawRoundedRect(7, 21, 4, 8, 2, skinColor);
        
        // Hand
        ctx.fillStyle = skinShadow;
        drawCircle(9, 29, 1.5, skinShadow);
        
        // Legs
        ctx.fillStyle = clothColor;
        drawRoundedRect(16, 29, 6, 8, 1, clothColor);
        
        // Foot
        ctx.fillStyle = skinColor;
        drawRoundedRect(14, 37, 8, 2, 1, skinColor);
        break;
        
      case 'right': // Right side view
        // Head (profile)
        ctx.fillStyle = skinColor;
        drawCircle(22, 10, 7, skinColor);
        
        // Pointed ear
        ctx.fillStyle = skinColor;
        drawRoundedRect(28, 8, 4, 6, 2, skinColor);
        
        // Eye (profile)
        ctx.fillStyle = eyeWhite;
        drawCircle(24, 9, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(25, 9, 1.5, eyeColor);
        
        // Hooked nose
        ctx.fillStyle = skinShadow;
        drawRoundedRect(26, 11, 4, 2, 1, skinShadow);
        
        // Mouth with teeth
        ctx.fillStyle = '#000000';
        drawRoundedRect(26, 13, 3, 2, 1, '#000000');
        ctx.fillStyle = teethColor;
        drawRoundedRect(27, 13, 1, 2, 0.5, teethColor);
        
        // Body (side view)
        ctx.fillStyle = clothColor;
        drawRoundedRect(14, 19, 12, 10, 3, clothColor);
        
        // Arms (side view)
        ctx.fillStyle = skinColor;
        drawRoundedRect(29, 21, 4, 8, 2, skinColor);
        
        // Hand
        ctx.fillStyle = skinShadow;
        drawCircle(31, 29, 1.5, skinShadow);
        
        // Legs
        ctx.fillStyle = clothColor;
        drawRoundedRect(18, 29, 6, 8, 1, clothColor);
        
        // Foot
        ctx.fillStyle = skinColor;
        drawRoundedRect(18, 37, 8, 2, 1, skinColor);
        break;
        
      // Diagonal views (simplified for goblins)
      case 'down_left':
      case 'down_right':
      case 'up_left':
      case 'up_right':
        // Use the same as front view for diagonals (simplified)
        ctx.fillStyle = skinColor;
        drawCircle(20, 10, 7, skinColor);
        
        // Ears
        ctx.fillStyle = skinColor;
        drawRoundedRect(8, 8, 4, 6, 2, skinColor);
        drawRoundedRect(28, 8, 4, 6, 2, skinColor);
        
        // Eyes
        ctx.fillStyle = eyeWhite;
        drawCircle(17, 9, 2, eyeWhite);
        drawCircle(23, 9, 2, eyeWhite);
        ctx.fillStyle = eyeColor;
        drawCircle(17, 9, 1.5, eyeColor);
        drawCircle(23, 9, 1.5, eyeColor);
        
        // Nose
        ctx.fillStyle = skinShadow;
        drawRoundedRect(19, 11, 2, 3, 1, skinShadow);
        
        // Grin
        ctx.fillStyle = '#000000';
        drawRoundedRect(17, 13, 6, 2, 1, '#000000');
        ctx.fillStyle = teethColor;
        drawRoundedRect(18, 13, 1, 2, 0.5, teethColor);
        drawRoundedRect(20, 13, 1, 2, 0.5, teethColor);
        drawRoundedRect(22, 13, 1, 2, 0.5, teethColor);
        
        // Body
        ctx.fillStyle = clothColor;
        drawRoundedRect(14, 19, 12, 10, 3, clothColor);
        
        // Arms
        ctx.fillStyle = skinColor;
        drawRoundedRect(9, 21, 4, 8, 2, skinColor);
        drawRoundedRect(27, 21, 4, 8, 2, skinColor);
        
        // Legs
        ctx.fillStyle = clothColor;
        drawRoundedRect(16, 29, 3, 8, 1, clothColor);
        drawRoundedRect(21, 29, 3, 8, 1, clothColor);
        
        // Feet
        ctx.fillStyle = skinColor;
        drawRoundedRect(15, 37, 5, 2, 1, skinColor);
        drawRoundedRect(20, 37, 5, 2, 1, skinColor);
        break;
    }
    
    // Add the canvas as a texture with direction suffix
    this.textures.addCanvas(`goblin_sprite_${direction}`, canvas);
  }





  private createEnvironmentSprites() {
    // Create detailed grass texture with variation
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 64;
    grassCanvas.height = 64;
    const grassCtx = grassCanvas.getContext('2d')!;
    
    // Base grass color
    grassCtx.fillStyle = '#228B22';
    grassCtx.fillRect(0, 0, 64, 64);
    
    // Add grass texture with random strands
    grassCtx.fillStyle = '#32CD32';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      grassCtx.fillRect(x, y, 1, Math.random() * 3 + 1);
    }
    
    // Add darker grass patches
    grassCtx.fillStyle = '#006400';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 60;
      const y = Math.random() * 60;
      grassCtx.fillRect(x, y, Math.random() * 4 + 2, Math.random() * 4 + 2);
    }
    
    this.textures.addCanvas('grass', grassCanvas);
    
    // Create detailed tree texture
    const treeCanvas = document.createElement('canvas');
    treeCanvas.width = 64;
    treeCanvas.height = 64;
    const treeCtx = treeCanvas.getContext('2d')!;
    
    // Tree trunk with bark texture
    treeCtx.fillStyle = '#8B4513';
    treeCtx.fillRect(26, 35, 12, 29);
    
    // Bark texture
    treeCtx.fillStyle = '#654321';
    treeCtx.fillRect(27, 36, 2, 27);
    treeCtx.fillRect(30, 38, 2, 25);
    treeCtx.fillRect(33, 36, 2, 27);
    
    // Tree trunk highlight
    treeCtx.fillStyle = '#CD853F';
    treeCtx.fillRect(28, 37, 1, 25);
    treeCtx.fillRect(31, 39, 1, 23);
    
    // Tree crown (multiple layers for depth)
    treeCtx.fillStyle = '#006400';
    treeCtx.beginPath();
    treeCtx.arc(32, 28, 18, 0, 2 * Math.PI);
    treeCtx.fill();
    
    treeCtx.fillStyle = '#228B22';
    treeCtx.beginPath();
    treeCtx.arc(32, 26, 16, 0, 2 * Math.PI);
    treeCtx.fill();
    
    treeCtx.fillStyle = '#32CD32';
    treeCtx.beginPath();
    treeCtx.arc(32, 24, 14, 0, 2 * Math.PI);
    treeCtx.fill();
    
    // Add leaf texture
    treeCtx.fillStyle = '#9ACD32';
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * 2 * Math.PI;
      const radius = 10 + Math.random() * 8;
      const x = 32 + Math.cos(angle) * radius;
      const y = 24 + Math.sin(angle) * radius;
      treeCtx.beginPath();
      treeCtx.arc(x, y, Math.random() * 2 + 1, 0, 2 * Math.PI);
      treeCtx.fill();
    }
    
    this.textures.addCanvas('tree', treeCanvas);
    
    // Create detailed rock texture
    const rockCanvas = document.createElement('canvas');
    rockCanvas.width = 64;
    rockCanvas.height = 64;
    const rockCtx = rockCanvas.getContext('2d')!;
    
    // Base rock shape (irregular)
    rockCtx.fillStyle = '#696969';
    rockCtx.beginPath();
    rockCtx.ellipse(32, 32, 22, 18, 0, 0, 2 * Math.PI);
    rockCtx.fill();
    
    // Rock shadows and highlights
    rockCtx.fillStyle = '#2F4F4F';
    rockCtx.beginPath();
    rockCtx.ellipse(35, 35, 18, 15, 0, 0, 2 * Math.PI);
    rockCtx.fill();
    
    rockCtx.fillStyle = '#A9A9A9';
    rockCtx.beginPath();
    rockCtx.ellipse(28, 28, 16, 13, 0, 0, 2 * Math.PI);
    rockCtx.fill();
    
    rockCtx.fillStyle = '#D3D3D3';
    rockCtx.beginPath();
    rockCtx.ellipse(26, 26, 12, 10, 0, 0, 2 * Math.PI);
    rockCtx.fill();
    
    // Add rock texture details
    rockCtx.fillStyle = '#556B2F';
    for (let i = 0; i < 15; i++) {
      const x = 20 + Math.random() * 24;
      const y = 20 + Math.random() * 24;
      rockCtx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    
    // Add cracks
    rockCtx.strokeStyle = '#2F4F4F';
    rockCtx.lineWidth = 1;
    rockCtx.beginPath();
    rockCtx.moveTo(20, 25);
    rockCtx.lineTo(30, 30);
    rockCtx.lineTo(25, 40);
    rockCtx.stroke();
    
    rockCtx.beginPath();
    rockCtx.moveTo(35, 20);
    rockCtx.lineTo(40, 35);
    rockCtx.stroke();
    
    this.textures.addCanvas('rock', rockCanvas);
    
    // Create detailed water texture with animation effect
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = 64;
    waterCanvas.height = 64;
    const waterCtx = waterCanvas.getContext('2d')!;
    
    // Base water color
    waterCtx.fillStyle = '#4169E1';
    waterCtx.fillRect(0, 0, 64, 64);
    
    // Water waves
    waterCtx.fillStyle = '#6495ED';
    for (let i = 0; i < 8; i++) {
      const y = i * 8;
      waterCtx.beginPath();
      waterCtx.moveTo(0, y);
      for (let x = 0; x < 64; x += 4) {
        waterCtx.lineTo(x, y + Math.sin(x * 0.2) * 2);
      }
      waterCtx.lineTo(64, y);
      waterCtx.lineTo(64, y + 4);
      waterCtx.lineTo(0, y + 4);
      waterCtx.fill();
    }
    
    // Water highlights
    waterCtx.fillStyle = '#87CEEB';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      waterCtx.beginPath();
      waterCtx.arc(x, y, Math.random() * 2 + 1, 0, 2 * Math.PI);
      waterCtx.fill();
    }
    
    this.textures.addCanvas('water', waterCanvas);
  }

  private createInteractiveSprites() {
    // Create detailed mining area sprite (rocks with pickaxe and ore)
    const miningCanvas = document.createElement('canvas');
    miningCanvas.width = 64;
    miningCanvas.height = 64;
    const miningCtx = miningCanvas.getContext('2d')!;
    
    // Base rocky ground
    miningCtx.fillStyle = '#8B7355';
    miningCtx.fillRect(0, 0, 64, 64);
    
    // Large rock formation
    miningCtx.fillStyle = '#696969';
    miningCtx.beginPath();
    miningCtx.ellipse(32, 35, 25, 20, 0, 0, 2 * Math.PI);
    miningCtx.fill();
    
    // Rock highlights and shadows
    miningCtx.fillStyle = '#2F4F4F';
    miningCtx.beginPath();
    miningCtx.ellipse(35, 38, 20, 16, 0, 0, 2 * Math.PI);
    miningCtx.fill();
    
    miningCtx.fillStyle = '#A9A9A9';
    miningCtx.beginPath();
    miningCtx.ellipse(28, 32, 18, 14, 0, 0, 2 * Math.PI);
    miningCtx.fill();
    
    // Ore veins
    miningCtx.fillStyle = '#FFD700'; // Gold vein
    miningCtx.fillRect(25, 30, 3, 8);
    miningCtx.fillRect(35, 35, 2, 6);
    
    miningCtx.fillStyle = '#C0C0C0'; // Silver vein
    miningCtx.fillRect(40, 28, 2, 10);
    
    // Pickaxe leaning against rock
    miningCtx.fillStyle = '#8B4513'; // Handle
    miningCtx.fillRect(45, 15, 3, 25);
    
    miningCtx.fillStyle = '#555555'; // Pickaxe head
    miningCtx.fillRect(40, 12, 12, 6);
    miningCtx.fillRect(42, 10, 8, 2); // Top spike
    miningCtx.fillRect(42, 18, 8, 2); // Bottom spike
    
    // Scattered ore pieces
    miningCtx.fillStyle = '#B8860B';
    miningCtx.fillRect(15, 50, 4, 3);
    miningCtx.fillRect(50, 45, 3, 4);
    miningCtx.fillRect(20, 45, 3, 3);
    
    this.textures.addCanvas('mining_area', miningCanvas);
    
    // Create detailed fishing area sprite (water with fishing rod and fish)
    const fishingCanvas = document.createElement('canvas');
    fishingCanvas.width = 64;
    fishingCanvas.height = 64;
    const fishingCtx = fishingCanvas.getContext('2d')!;
    
    // Water base
    fishingCtx.fillStyle = '#4169E1';
    fishingCtx.fillRect(0, 0, 64, 64);
    
    // Water ripples
    fishingCtx.fillStyle = '#6495ED';
    for (let i = 0; i < 6; i++) {
      const y = i * 10 + 5;
      fishingCtx.beginPath();
      fishingCtx.moveTo(0, y);
      for (let x = 0; x < 64; x += 3) {
        fishingCtx.lineTo(x, y + Math.sin(x * 0.3) * 1.5);
      }
      fishingCtx.lineTo(64, y);
      fishingCtx.lineTo(64, y + 3);
      fishingCtx.lineTo(0, y + 3);
      fishingCtx.fill();
    }
    
    // Fishing rod
    fishingCtx.fillStyle = '#8B4513';
    fishingCtx.fillRect(50, 5, 2, 35);
    
    // Rod tip
    fishingCtx.fillStyle = '#654321';
    fishingCtx.fillRect(50, 5, 2, 5);
    
    // Fishing line
    fishingCtx.strokeStyle = '#000000';
    fishingCtx.lineWidth = 1;
    fishingCtx.beginPath();
    fishingCtx.moveTo(52, 8);
    fishingCtx.lineTo(35, 25);
    fishingCtx.lineTo(30, 40);
    fishingCtx.stroke();
    
    // Bobber
    fishingCtx.fillStyle = '#FF0000';
    fishingCtx.beginPath();
    fishingCtx.arc(30, 40, 2, 0, 2 * Math.PI);
    fishingCtx.fill();
    
    // Fish silhouettes under water
    fishingCtx.fillStyle = '#FF6347';
    fishingCtx.beginPath();
    fishingCtx.ellipse(20, 45, 6, 3, 0, 0, 2 * Math.PI);
    fishingCtx.fill();
    
    fishingCtx.fillStyle = '#32CD32';
    fishingCtx.beginPath();
    fishingCtx.ellipse(45, 50, 5, 2.5, 0, 0, 2 * Math.PI);
    fishingCtx.fill();
    
    // Fish tails
    fishingCtx.fillStyle = '#FF6347';
    fishingCtx.beginPath();
    fishingCtx.moveTo(14, 45);
    fishingCtx.lineTo(10, 42);
    fishingCtx.lineTo(10, 48);
    fishingCtx.fill();
    
    fishingCtx.fillStyle = '#32CD32';
    fishingCtx.beginPath();
    fishingCtx.moveTo(50, 50);
    fishingCtx.lineTo(54, 48);
    fishingCtx.lineTo(54, 52);
    fishingCtx.fill();
    
    // Lily pads
    fishingCtx.fillStyle = '#228B22';
    fishingCtx.beginPath();
    fishingCtx.ellipse(10, 20, 5, 4, 0, 0, 2 * Math.PI);
    fishingCtx.fill();
    
    fishingCtx.beginPath();
    fishingCtx.ellipse(55, 30, 4, 3, 0, 0, 2 * Math.PI);
    fishingCtx.fill();
    
    this.textures.addCanvas('fishing_area', fishingCanvas);
    
    // Create detailed cooking area sprite (fire with pot and food)
    const cookingCanvas = document.createElement('canvas');
    cookingCanvas.width = 64;
    cookingCanvas.height = 64;
    const cookingCtx = cookingCanvas.getContext('2d')!;
    
    // Ground/stone base
    cookingCtx.fillStyle = '#8B7355';
    cookingCtx.fillRect(0, 0, 64, 64);
    
    // Stone fire pit
    cookingCtx.fillStyle = '#696969';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const x = 32 + Math.cos(angle) * 20;
      const y = 45 + Math.sin(angle) * 15;
      cookingCtx.beginPath();
      cookingCtx.arc(x, y, 4, 0, 2 * Math.PI);
      cookingCtx.fill();
    }
    
    // Fire (multiple layers)
    cookingCtx.fillStyle = '#8B0000'; // Dark red base
    cookingCtx.beginPath();
    cookingCtx.ellipse(32, 45, 12, 8, 0, 0, 2 * Math.PI);
    cookingCtx.fill();
    
    cookingCtx.fillStyle = '#FF4500'; // Orange flames
    cookingCtx.beginPath();
    cookingCtx.ellipse(32, 42, 10, 6, 0, 0, 2 * Math.PI);
    cookingCtx.fill();
    
    cookingCtx.fillStyle = '#FF6347'; // Red flames
    cookingCtx.beginPath();
    cookingCtx.ellipse(32, 40, 8, 4, 0, 0, 2 * Math.PI);
    cookingCtx.fill();
    
    cookingCtx.fillStyle = '#FFD700'; // Yellow flame tips
    cookingCtx.beginPath();
    cookingCtx.ellipse(32, 38, 6, 3, 0, 0, 2 * Math.PI);
    cookingCtx.fill();
    
    // Cooking pot
    cookingCtx.fillStyle = '#2F4F4F';
    cookingCtx.fillRect(25, 25, 14, 10);
    
    // Pot rim
    cookingCtx.fillStyle = '#696969';
    cookingCtx.fillRect(24, 24, 16, 2);
    
    // Pot handles
    cookingCtx.strokeStyle = '#2F4F4F';
    cookingCtx.lineWidth = 2;
    cookingCtx.beginPath();
    cookingCtx.arc(22, 30, 3, 0, Math.PI);
    cookingCtx.stroke();
    
    cookingCtx.beginPath();
    cookingCtx.arc(42, 30, 3, 0, Math.PI);
    cookingCtx.stroke();
    
    // Steam
    cookingCtx.fillStyle = '#F0F8FF';
    cookingCtx.globalAlpha = 0.6;
    for (let i = 0; i < 5; i++) {
      cookingCtx.beginPath();
      cookingCtx.arc(30 + i * 2, 20 - i * 2, 2, 0, 2 * Math.PI);
      cookingCtx.fill();
    }
    cookingCtx.globalAlpha = 1;
    
    // Cooking utensils
    cookingCtx.fillStyle = '#8B4513';
    cookingCtx.fillRect(45, 15, 2, 15); // Spoon handle
    
    cookingCtx.fillStyle = '#C0C0C0';
    cookingCtx.beginPath();
    cookingCtx.ellipse(46, 15, 2, 4, 0, 0, 2 * Math.PI);
    cookingCtx.fill();
    
    // Food ingredients around the area
    cookingCtx.fillStyle = '#FF6347'; // Tomatoes
    cookingCtx.beginPath();
    cookingCtx.arc(15, 20, 3, 0, 2 * Math.PI);
    cookingCtx.fill();
    
    cookingCtx.fillStyle = '#32CD32'; // Lettuce
    cookingCtx.beginPath();
    cookingCtx.arc(50, 20, 3, 0, 2 * Math.PI);
    cookingCtx.fill();
    
    cookingCtx.fillStyle = '#DEB887'; // Bread
    cookingCtx.fillRect(10, 50, 8, 4);
    
    this.textures.addCanvas('cooking_area', cookingCanvas);
    
    // Create detailed woodcutting area sprite (tree with axe and logs)
    const woodcuttingCanvas = document.createElement('canvas');
    woodcuttingCanvas.width = 64;
    woodcuttingCanvas.height = 64;
    const woodcuttingCtx = woodcuttingCanvas.getContext('2d')!;
    
    // Ground
    woodcuttingCtx.fillStyle = '#8B7355';
    woodcuttingCtx.fillRect(0, 0, 64, 64);
    
    // Tree trunk (larger)
    woodcuttingCtx.fillStyle = '#8B4513';
    woodcuttingCtx.fillRect(25, 20, 14, 44);
    
    // Bark texture
    woodcuttingCtx.fillStyle = '#654321';
    woodcuttingCtx.fillRect(26, 21, 2, 42);
    woodcuttingCtx.fillRect(29, 23, 2, 40);
    woodcuttingCtx.fillRect(32, 21, 2, 42);
    woodcuttingCtx.fillRect(35, 23, 2, 40);
    
    // Tree crown
    woodcuttingCtx.fillStyle = '#006400';
    woodcuttingCtx.beginPath();
    woodcuttingCtx.arc(32, 18, 20, 0, 2 * Math.PI);
    woodcuttingCtx.fill();
    
    woodcuttingCtx.fillStyle = '#228B22';
    woodcuttingCtx.beginPath();
    woodcuttingCtx.arc(32, 16, 18, 0, 2 * Math.PI);
    woodcuttingCtx.fill();
    
    woodcuttingCtx.fillStyle = '#32CD32';
    woodcuttingCtx.beginPath();
    woodcuttingCtx.arc(32, 14, 16, 0, 2 * Math.PI);
    woodcuttingCtx.fill();
    
    // Axe embedded in tree
    woodcuttingCtx.fillStyle = '#8B4513'; // Handle
    woodcuttingCtx.fillRect(42, 35, 3, 20);
    
    woodcuttingCtx.fillStyle = '#555555'; // Axe head
    woodcuttingCtx.fillRect(35, 32, 12, 8);
    
    // Axe blade
    woodcuttingCtx.fillStyle = '#C0C0C0';
    woodcuttingCtx.beginPath();
    woodcuttingCtx.moveTo(35, 36);
    woodcuttingCtx.lineTo(30, 32);
    woodcuttingCtx.lineTo(30, 40);
    woodcuttingCtx.fill();
    
    // Wood chips
    woodcuttingCtx.fillStyle = '#DEB887';
    woodcuttingCtx.fillRect(48, 45, 3, 2);
    woodcuttingCtx.fillRect(45, 50, 2, 3);
    woodcuttingCtx.fillRect(50, 48, 2, 2);
    
    // Cut logs on ground
    woodcuttingCtx.fillStyle = '#8B4513';
    woodcuttingCtx.fillRect(10, 50, 15, 4);
    woodcuttingCtx.fillRect(8, 55, 12, 4);
    
    // Log end grain
    woodcuttingCtx.fillStyle = '#DEB887';
    woodcuttingCtx.beginPath();
    woodcuttingCtx.arc(10, 52, 2, 0, 2 * Math.PI);
    woodcuttingCtx.fill();
    
    woodcuttingCtx.beginPath();
    woodcuttingCtx.arc(8, 57, 2, 0, 2 * Math.PI);
    woodcuttingCtx.fill();
    
    // Tree rings
    woodcuttingCtx.strokeStyle = '#654321';
    woodcuttingCtx.lineWidth = 1;
    woodcuttingCtx.beginPath();
    woodcuttingCtx.arc(10, 52, 1, 0, 2 * Math.PI);
    woodcuttingCtx.stroke();
    
    woodcuttingCtx.beginPath();
    woodcuttingCtx.arc(8, 57, 1, 0, 2 * Math.PI);
    woodcuttingCtx.stroke();
    
    this.textures.addCanvas('woodcutting_area', woodcuttingCanvas);
    
    // Create enhanced interaction indicator (glowing outline with particles)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const glowCtx = glowCanvas.getContext('2d')!;
    
    // Outer glow
    glowCtx.strokeStyle = '#FFD700';
    glowCtx.lineWidth = 6;
    glowCtx.globalAlpha = 0.3;
    glowCtx.strokeRect(6, 6, 52, 52);
    
    // Middle glow
    glowCtx.strokeStyle = '#FFFF00';
    glowCtx.lineWidth = 4;
    glowCtx.globalAlpha = 0.5;
    glowCtx.strokeRect(8, 8, 48, 48);
    
    // Inner glow
    glowCtx.strokeStyle = '#FFFFFF';
    glowCtx.lineWidth = 2;
    glowCtx.globalAlpha = 0.8;
    glowCtx.strokeRect(10, 10, 44, 44);
    
    // Sparkle particles
    glowCtx.fillStyle = '#FFFFFF';
    glowCtx.globalAlpha = 1;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const x = 32 + Math.cos(angle) * 25;
      const y = 32 + Math.sin(angle) * 25;
      glowCtx.beginPath();
      glowCtx.arc(x, y, 1, 0, 2 * Math.PI);
      glowCtx.fill();
    }
    
    this.textures.addCanvas('interaction_glow', glowCanvas);
    
    // Create enhanced move target indicator
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = 16;
    targetCanvas.height = 16;
    const targetCtx = targetCanvas.getContext('2d')!;
    
    // Outer ring
    targetCtx.strokeStyle = '#00FF00';
    targetCtx.lineWidth = 2;
    targetCtx.globalAlpha = 0.8;
    targetCtx.beginPath();
    targetCtx.arc(8, 8, 6, 0, 2 * Math.PI);
    targetCtx.stroke();
    
    // Inner dot
    targetCtx.fillStyle = '#00FF00';
    targetCtx.globalAlpha = 1;
    targetCtx.beginPath();
    targetCtx.arc(8, 8, 2, 0, 2 * Math.PI);
    targetCtx.fill();
    
    // Cross hairs
    targetCtx.strokeStyle = '#00FF00';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.moveTo(8, 2);
    targetCtx.lineTo(8, 6);
    targetCtx.moveTo(8, 10);
    targetCtx.lineTo(8, 14);
    targetCtx.moveTo(2, 8);
    targetCtx.lineTo(6, 8);
    targetCtx.moveTo(10, 8);
    targetCtx.lineTo(14, 8);
    targetCtx.stroke();
    
    this.textures.addCanvas('move_target', targetCanvas);
    
    // Create detailed loot drop indicator (treasure chest icon)
    const lootCanvas = document.createElement('canvas');
    lootCanvas.width = 32;
    lootCanvas.height = 32;
    const lootCtx = lootCanvas.getContext('2d')!;
    
    // Chest base
    lootCtx.fillStyle = '#8B4513'; // Brown chest body
    lootCtx.fillRect(6, 12, 20, 16);
    
    // Chest lid
    lootCtx.fillStyle = '#654321'; // Dark brown lid
    lootCtx.fillRect(4, 8, 24, 8);
    
    // Gold trim
    lootCtx.fillStyle = '#FFD700';
    lootCtx.fillRect(4, 8, 24, 2); // Top trim
    lootCtx.fillRect(4, 14, 24, 2); // Middle trim
    lootCtx.fillRect(6, 26, 20, 2); // Bottom trim
    lootCtx.fillRect(4, 8, 2, 8); // Left trim
    lootCtx.fillRect(26, 8, 2, 8); // Right trim
    
    // Lock
    lootCtx.fillStyle = '#FFD700';
    lootCtx.fillRect(13, 16, 6, 8);
    lootCtx.fillStyle = '#B8860B';
    lootCtx.fillRect(14, 17, 4, 6);
    
    // Lock keyhole
    lootCtx.fillStyle = '#000000';
    lootCtx.beginPath();
    lootCtx.arc(16, 19, 1, 0, 2 * Math.PI);
    lootCtx.fill();
    lootCtx.fillRect(15.5, 19, 1, 2);
    
    // Chest corners (metal reinforcement)
    lootCtx.fillStyle = '#C0C0C0';
    lootCtx.fillRect(4, 8, 3, 3);
    lootCtx.fillRect(25, 8, 3, 3);
    lootCtx.fillRect(4, 13, 3, 3);
    lootCtx.fillRect(25, 13, 3, 3);
    
    // Sparkle effect
    lootCtx.fillStyle = '#FFFFFF';
    lootCtx.beginPath();
    lootCtx.arc(8, 6, 1, 0, 2 * Math.PI);
    lootCtx.fill();
    lootCtx.beginPath();
    lootCtx.arc(24, 6, 1, 0, 2 * Math.PI);
    lootCtx.fill();
    
    this.textures.addCanvas('loot_drop', lootCanvas);
  }

  private hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 255,
      g: (hex >> 8) & 255,
      b: hex & 255
    };
  }

  create() {
    // Create world bounds for top-down view
    this.physics.world.setBounds(0, 0, 1600, 1200);
    
    // Create grass background
    for (let x = 0; x < 1600; x += 64) {
      for (let y = 0; y < 1200; y += 64) {
        this.add.image(x + 32, y + 32, 'grass');
      }
    }
    
    // Add some environmental decorations
    this.add.image(200, 200, 'tree');
    this.add.image(400, 150, 'tree');
    this.add.image(600, 300, 'rock');
    this.add.image(800, 250, 'tree');
    this.add.image(1000, 400, 'rock');
    this.add.image(1200, 500, 'tree');
    this.add.image(300, 700, 'rock');
    this.add.image(1400, 800, 'tree');
    
    // Create player with simple sprite
    this.player = this.physics.add.sprite(800, 600, 'player_sprite_down'); // Default to down
    this.player.setCollideWorldBounds(true);
    this.player.setSize(32, 32); // Updated for larger sprite
    this.player.setOffset(8, 8); // Adjusted offset
    
    // No complex animations for now - just use the static sprite
    
    // Create interactive objects group
    this.interactiveObjects = this.physics.add.group();
    
    // Create activity areas with proper sprites
    this.miningArea = this.physics.add.sprite(300, 300, 'mining_area');
    this.miningArea.setSize(60, 60);
    this.miningArea.setData('activity', 'mining');
    this.miningArea.setData('name', 'Mining Area');
    this.interactiveObjects.add(this.miningArea);
    
    this.fishingArea = this.physics.add.sprite(1200, 200, 'fishing_area');
    this.fishingArea.setSize(60, 60);
    this.fishingArea.setData('activity', 'fishing');
    this.fishingArea.setData('name', 'Fishing Area');
    this.interactiveObjects.add(this.fishingArea);
    
    this.cookingArea = this.physics.add.sprite(200, 800, 'cooking_area');
    this.cookingArea.setSize(60, 60);
    this.cookingArea.setData('activity', 'cooking');
    this.cookingArea.setData('name', 'Cooking Area');
    this.interactiveObjects.add(this.cookingArea);
    
    this.woodcuttingArea = this.physics.add.sprite(1000, 900, 'woodcutting_area');
    this.woodcuttingArea.setSize(60, 60);
    this.woodcuttingArea.setData('activity', 'woodcutting');
    this.woodcuttingArea.setData('name', 'Woodcutting Area');
    this.interactiveObjects.add(this.woodcuttingArea);
    
    // Add glowing effects to interactive objects
    this.interactiveObjects.children.entries.forEach(obj => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const glow = this.add.image(sprite.x, sprite.y, 'interaction_glow');
      glow.setAlpha(0.6);
      glow.setScale(1.1);
      
      // Animate the glow
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.6, to: 0.2 },
        scale: { from: 1.1, to: 1.2 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
    
    // Add activity labels with better styling
    this.add.text(240, 250, '⛏️ Mining', { 
      fontSize: '16px', 
      color: '#8B4513', 
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 2
    });
    this.add.text(1120, 150, '🎣 Fishing', { 
      fontSize: '16px', 
      color: '#4169E1', 
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 2
    });
    this.add.text(130, 750, '🍳 Cooking', { 
      fontSize: '16px', 
      color: '#FF6347', 
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 2
    });
    this.add.text(910, 850, '🪓 Woodcutting', { 
      fontSize: '16px', 
      color: '#228B22', 
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 2
    });
    
    // Create goblins group
    this.goblins = this.physics.add.group();
    
    // No complex goblin animations for now
    
    // Spawn initial goblins
    this.spawnGoblin(1300, 700);
    this.spawnGoblin(500, 500);
    this.spawnGoblin(700, 400);
    
    // Setup input - click-to-move system
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    
    // Setup interactions
    this.physics.add.overlap(this.player, this.goblins, this.startCombat, undefined, this);
    this.physics.add.overlap(this.player, this.interactiveObjects, this.handleInteraction, undefined, this);
    
    // Create UI
    this.createUI();
    
    // Setup camera for top-down view
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    this.cameras.main.setZoom(1.5);
    
    // Emit scene ready event
    EventBus.emit('current-scene-ready', this);
  }

  private handleInteraction(player: any, interactiveObject: any) {
    const sprite = interactiveObject as Phaser.Physics.Arcade.Sprite;
    const activity = sprite.getData('activity');
    const name = sprite.getData('name');
    
    if (!this.activityInProgress && !this.isInCombat) {
      this.statusText.setText(`Click on ${name} to interact`);
      sprite.setData('canInteract', true);
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.isInCombat) return;

    const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
    const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;

    // Check if clicking on an interactive object
    let clickedOnInteractive = false;
    this.interactiveObjects.children.entries.forEach(obj => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const bounds = sprite.getBounds();
      
      if (bounds.contains(worldX, worldY) && sprite.getData('canInteract')) {
        const activity = sprite.getData('activity');
        this.performActivity(activity);
        clickedOnInteractive = true;
        return;
      }
    });

    // Check if clicking on a goblin to attack
    this.goblins.children.entries.forEach(goblin => {
      const sprite = goblin as Phaser.Physics.Arcade.Sprite;
      const bounds = sprite.getBounds();
      
      if (bounds.contains(worldX, worldY)) {
        this.moveToTarget(worldX, worldY, () => {
          this.startCombat(this.player, sprite);
        });
        clickedOnInteractive = true;
        return;
      }
    });

    // If not clicking on an interactive object, move to position
    if (!clickedOnInteractive) {
      this.moveToTarget(worldX, worldY);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isInCombat) return;

    const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
    const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;

    // Check if hovering over interactive objects or goblins
    let hoveringOverInteractive = false;
    
    // Check interactive objects
    this.interactiveObjects.children.entries.forEach(obj => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const bounds = sprite.getBounds();
      
      if (bounds.contains(worldX, worldY) && sprite.getData('canInteract')) {
        this.input.setDefaultCursor('pointer');
        hoveringOverInteractive = true;
        return;
      }
    });

    // Check goblins
    if (!hoveringOverInteractive) {
      this.goblins.children.entries.forEach(goblin => {
        const sprite = goblin as Phaser.Physics.Arcade.Sprite;
        const bounds = sprite.getBounds();
        
        if (bounds.contains(worldX, worldY)) {
          this.input.setDefaultCursor('crosshair');
          hoveringOverInteractive = true;
          return;
        }
      });
    }

    // Reset cursor if not hovering over anything interactive
    if (!hoveringOverInteractive) {
      this.input.setDefaultCursor('default');
    }
  }

  private moveToTarget(targetX: number, targetY: number, onComplete?: () => void) {
    // Stop any existing movement
    if (this.moveTween) {
      this.moveTween.stop();
    }

    // Remove previous target indicator
    if (this.moveTargetIndicator) {
      this.moveTargetIndicator.destroy();
    }

    // Create target indicator
    this.moveTargetIndicator = this.add.image(targetX, targetY, 'move_target');
    
    // Animate the target indicator
    this.tweens.add({
      targets: this.moveTargetIndicator,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.targetPosition = { x: targetX, y: targetY };
    
    // Calculate direction for sprite orientation
    const deltaX = targetX - this.player.x;
    const deltaY = targetY - this.player.y;
    
    // Update player direction and sprite
    this.playerDirection = this.calculateDirection(deltaX, deltaY);
    this.updatePlayerSprite();

    // Calculate distance and duration
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    const duration = (distance / this.moveSpeed) * 1000;

    // Create movement tween
    this.moveTween = this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        // Reset to default direction when movement stops
        this.playerDirection = 'down';
        this.updatePlayerSprite();
        
        this.targetPosition = null;
        this.moveTween = null;
        
        // Remove target indicator
        if (this.moveTargetIndicator) {
          this.moveTargetIndicator.destroy();
          this.moveTargetIndicator = null;
        }
        
        if (onComplete) {
          onComplete();
        }
      }
    });
  }

  private updatePlayerSprite() {
    // Update the player sprite texture based on current direction
    const spriteKey = `player_sprite_${this.playerDirection}`;
    this.player.setTexture(spriteKey);
  }

  private calculateDirection(deltaX: number, deltaY: number): string {
    // Calculate angle and convert to direction
    const angle = Math.atan2(deltaY, deltaX);
    const degrees = (angle * 180 / Math.PI + 360) % 360;
    
    // Convert angle to direction (8 directions)
    if (degrees >= 337.5 || degrees < 22.5) {
      return 'right';
    } else if (degrees >= 22.5 && degrees < 67.5) {
      return 'down_right';
    } else if (degrees >= 67.5 && degrees < 112.5) {
      return 'down';
    } else if (degrees >= 112.5 && degrees < 157.5) {
      return 'down_left';
    } else if (degrees >= 157.5 && degrees < 202.5) {
      return 'left';
    } else if (degrees >= 202.5 && degrees < 247.5) {
      return 'up_left';
    } else if (degrees >= 247.5 && degrees < 292.5) {
      return 'up';
    } else if (degrees >= 292.5 && degrees < 337.5) {
      return 'up_right';
    }
    
    return 'down'; // Default fallback
  }

  private createUI() {
    // Status text - positioned to not overlap with top bar
    this.statusText = this.add.text(16, 80, 'Welcome to Lumbridge!', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 10, y: 5 }
    });

    // Create empty combat UI container for compatibility
    this.combatUI = this.add.container(400, 300);
    this.combatUI.setVisible(false);
  }

  private spawnGoblin(x: number, y: number) {
    const goblin = this.physics.add.sprite(x, y, 'goblin_sprite_down'); // Default to down
    goblin.setCollideWorldBounds(true);
    goblin.setSize(28, 28); // Updated for larger sprite
    goblin.setOffset(6, 6); // Adjusted offset
    goblin.setData('health', 25);
    goblin.setData('maxHealth', 25);
    goblin.setData('attack', 3);
    goblin.setData('defense', 1);
    goblin.setData('direction', 'down'); // Track goblin direction
    this.goblins.add(goblin);
    
    // Enhanced AI - move randomly with directional sprites
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (goblin.active && !this.isInCombat) {
          const direction = Phaser.Math.Between(0, 8);
          const speed = 30;
          let goblinDirection = 'down';
          
          switch (direction) {
            case 0: 
              goblin.setVelocity(0, -speed); 
              goblinDirection = 'up';
              break;
            case 1: 
              goblin.setVelocity(speed, -speed); 
              goblinDirection = 'up_right';
              break;
            case 2: 
              goblin.setVelocity(speed, 0); 
              goblinDirection = 'right';
              break;
            case 3: 
              goblin.setVelocity(speed, speed); 
              goblinDirection = 'down_right';
              break;
            case 4: 
              goblin.setVelocity(0, speed); 
              goblinDirection = 'down';
              break;
            case 5: 
              goblin.setVelocity(-speed, speed); 
              goblinDirection = 'down_left';
              break;
            case 6: 
              goblin.setVelocity(-speed, 0); 
              goblinDirection = 'left';
              break;
            case 7: 
              goblin.setVelocity(-speed, -speed); 
              goblinDirection = 'up_left';
              break;
            case 8:
              goblin.setVelocity(0, 0);
              goblinDirection = 'down'; // Default when standing still
              break;
          }
          
          // Update goblin sprite based on direction
          this.updateGoblinSprite(goblin, goblinDirection);
          
          // Stop after a short time
          this.time.delayedCall(1500, () => {
            if (goblin.active) {
              goblin.setVelocity(0, 0);
              // Reset to default direction when stopped
              this.updateGoblinSprite(goblin, 'down');
            }
          });
        }
      },
      loop: true
    });
  }

  private updateGoblinSprite(goblin: Phaser.Physics.Arcade.Sprite, direction: string) {
    // Update the goblin sprite texture based on direction
    const spriteKey = `goblin_sprite_${direction}`;
    goblin.setTexture(spriteKey);
    goblin.setData('direction', direction);
  }

  private startCombat(player: any, goblin: any) {
    if (this.isInCombat) return;
    
    const playerSprite = player as Phaser.Physics.Arcade.Sprite;
    const goblinSprite = goblin as Phaser.Physics.Arcade.Sprite;
    
    this.isInCombat = true;
    this.currentEnemy = goblinSprite;
    this.playerTurn = true;
    
    // Stop any movement
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    
    // Stop any movement
    playerSprite.setVelocity(0);
    goblinSprite.setVelocity(0);
    
    this.statusText.setText('Auto-battle started! Fighting goblin...');
    
    // Start auto-battle timer
    this.startAutoBattle();
  }

  private startAutoBattle() {
    if (!this.currentEnemy) return;
    
    // Combat happens every 1.5 seconds
    this.combatTimer = this.time.addEvent({
      delay: 1500,
      callback: this.performAutoBattleRound,
      callbackScope: this,
      loop: true
    });
  }
  
  private performAutoBattleRound() {
    if (!this.currentEnemy || !this.isInCombat) return;
    
    if (this.playerTurn) {
      // Player attacks
      this.performPlayerAttack();
    } else {
      // Enemy attacks
      this.performEnemyAttack();
    }
    
    this.playerTurn = !this.playerTurn;
  }
  
  private performPlayerAttack() {
    if (!this.currentEnemy) return;
    
    // Calculate damage
    const baseDamage = this.playerStats.attack;
    const randomFactor = Phaser.Math.Between(80, 120) / 100; // 80-120% of base damage
    const damage = Math.floor(baseDamage * randomFactor);
    
    // Apply damage
    const currentHealth = this.currentEnemy.getData('health');
    const newHealth = Math.max(0, currentHealth - damage);
    this.currentEnemy.setData('health', newHealth);
    
    // Show attack animation and damage
    this.showAttackAnimation(this.player, this.currentEnemy);
    this.showDamageIndicator(this.currentEnemy, damage, '#ff4444');
    
    // Check if enemy is defeated
    if (newHealth <= 0) {
      this.time.delayedCall(800, () => {
        this.endCombat(true, this.currentEnemy!);
      });
    }
  }
  
  private performEnemyAttack() {
    if (!this.currentEnemy) return;
    
    // Calculate damage
    const baseDamage = this.currentEnemy.getData('attack');
    const randomFactor = Phaser.Math.Between(80, 120) / 100; // 80-120% of base damage
    const damage = Math.floor(baseDamage * randomFactor);
    
    // Apply damage
    this.playerStats.health = Math.max(0, this.playerStats.health - damage);
    
    // Show attack animation and damage
    this.showAttackAnimation(this.currentEnemy, this.player);
    this.showDamageIndicator(this.player, damage, '#ff4444');
    
    // Check if player is defeated
    if (this.playerStats.health <= 0) {
      this.time.delayedCall(800, () => {
        this.endCombat(false, this.currentEnemy!);
      });
    }
  }

  private showAttackAnimation(attacker: Phaser.Physics.Arcade.Sprite, target: Phaser.Physics.Arcade.Sprite) {
    // Move attacker slightly toward target
    const originalX = attacker.x;
    const originalY = attacker.y;
    const targetX = target.x;
    const targetY = target.y;
    
    // Calculate direction
    const deltaX = targetX - originalX;
    const deltaY = targetY - originalY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Update sprite direction if this is the player
    if (attacker === this.player) {
      this.playerDirection = this.calculateDirection(deltaX, deltaY);
      this.updatePlayerSprite();
    }
    
    // Move 20 pixels toward target
    const moveX = originalX + (deltaX / distance) * 20;
    const moveY = originalY + (deltaY / distance) * 20;
    
    // Attack animation
    this.tweens.add({
      targets: attacker,
      x: moveX,
      y: moveY,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        attacker.x = originalX;
        attacker.y = originalY;
        
        // Reset player sprite to default direction after attack
        if (attacker === this.player) {
          this.playerDirection = 'down';
          this.updatePlayerSprite();
        }
      }
    });
  }
  
  private showDamageIndicator(target: Phaser.Physics.Arcade.Sprite, damage: number, color: string) {
    // Create damage text
    const damageText = this.add.text(target.x, target.y - 30, `-${damage}`, {
      fontSize: '20px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // Animate damage text
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
    });
    
    // Flash effect on target
    this.tweens.add({
      targets: target,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 3
    });
  }
  
  private showDamageEffect(target: Phaser.Physics.Arcade.Sprite, damage: number) {
    // Flash effect
    target.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      target.clearTint();
    });
    
    // Floating damage text
    const damageText = this.add.text(target.x, target.y - 20, `-${damage}`, {
      fontSize: '16px',
      color: '#ff0000',
      fontStyle: 'bold'
    });
    
    this.tweens.add({
      targets: damageText,
      y: target.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy()
    });
  }

  private endCombat(victory: boolean, goblin: Phaser.Physics.Arcade.Sprite) {
    this.isInCombat = false;
    this.currentEnemy = null;
    
    // Stop combat timer
    if (this.combatTimer) {
      this.combatTimer.destroy();
      this.combatTimer = null;
    }
    
    if (victory) {
      this.statusText.setText('Victory! You defeated the goblin!');
      
      // Create loot drop at goblin's position
      this.createLootDrop(goblin.x, goblin.y);
      
      goblin.destroy();
      
      // Respawn goblin after delay
      this.time.delayedCall(15000, () => {
        this.spawnGoblin(
          Phaser.Math.Between(100, 1500),
          Phaser.Math.Between(100, 1100)
        );
      });
    } else {
      this.statusText.setText('Defeat! You were defeated by the goblin.');
      this.playerStats.health = this.playerStats.maxHealth; // Respawn with full health
    }
    
    // Clear status after delay
    this.time.delayedCall(3000, () => {
      this.statusText.setText('');
    });
  }

  private createLootDrop(x: number, y: number) {
    // Define possible NFT loot drops
    const nftLootTable = [
      { id: 101, name: 'Goblin Sword', rarity: 'Common', value: 10 },
      { id: 102, name: 'Goblin Shield', rarity: 'Common', value: 8 },
      { id: 103, name: 'Goblin Helmet', rarity: 'Uncommon', value: 15 },
      { id: 104, name: 'Goblin Boots', rarity: 'Uncommon', value: 12 },
      { id: 105, name: 'Goblin Ring', rarity: 'Rare', value: 25 },
      { id: 106, name: 'Goblin Amulet', rarity: 'Rare', value: 30 },
      { id: 107, name: 'Goblin Crown', rarity: 'Epic', value: 50 },
      { id: 108, name: 'Ancient Goblin Relic', rarity: 'Legendary', value: 100 }
    ];
    
    // Weighted random selection based on rarity
    const random = Math.random();
    let selectedLoot;
    
    if (random < 0.50) { // 50% chance for Common
      selectedLoot = nftLootTable.filter(item => item.rarity === 'Common')[Math.floor(Math.random() * 2)];
    } else if (random < 0.75) { // 25% chance for Uncommon
      selectedLoot = nftLootTable.filter(item => item.rarity === 'Uncommon')[Math.floor(Math.random() * 2)];
    } else if (random < 0.90) { // 15% chance for Rare
      selectedLoot = nftLootTable.filter(item => item.rarity === 'Rare')[Math.floor(Math.random() * 2)];
    } else if (random < 0.98) { // 8% chance for Epic
      selectedLoot = nftLootTable[6]; // Goblin Crown
    } else { // 2% chance for Legendary
      selectedLoot = nftLootTable[7]; // Ancient Goblin Relic
    }
    
    // Create visual loot drop
    const lootSprite = this.add.image(x, y, 'loot_drop'); // Use treasure chest sprite
    lootSprite.setScale(1.2);
    lootSprite.setTint(this.getRarityColor(selectedLoot.rarity));
    lootSprite.setInteractive();
    lootSprite.setData('loot', selectedLoot);
    
    // Add glow effect
    this.tweens.add({
      targets: lootSprite,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add loot pickup interaction
    lootSprite.on('pointerdown', () => {
      this.pickupLoot(lootSprite, selectedLoot);
    });
    
    // Show loot notification
    this.statusText.setText(`${selectedLoot.name} dropped! Click to pick up.`);
    
    // Auto-pickup after 30 seconds if not collected
    this.time.delayedCall(30000, () => {
      if (lootSprite.active) {
        this.pickupLoot(lootSprite, selectedLoot);
      }
    });
  }
  
  private getRarityColor(rarity: string): number {
    switch (rarity) {
      case 'Common': return 0x808080; // Gray
      case 'Uncommon': return 0x00ff00; // Green
      case 'Rare': return 0x0080ff; // Blue
      case 'Epic': return 0x8000ff; // Purple
      case 'Legendary': return 0xffa500; // Orange
      default: return 0xffffff; // White
    }
  }
  
  private pickupLoot(lootSprite: Phaser.GameObjects.Image, loot: any) {
    // Remove the loot sprite
    lootSprite.destroy();
    
    // Add to Smart Wallet (emit event)
    EventBus.emit('nft-loot-obtained', {
      itemId: loot.id,
      itemName: loot.name,
      rarity: loot.rarity,
      value: loot.value,
      quantity: 1
    });
    
    // Also dispatch to window for React components
    window.dispatchEvent(new CustomEvent('nft-loot-obtained', {
      detail: {
        itemId: loot.id,
        itemName: loot.name,
        rarity: loot.rarity,
        value: loot.value,
        quantity: 1
      }
    }));
    
    // Show pickup notification
    this.statusText.setText(`Picked up ${loot.name} (${loot.rarity})!`);
    
    // Clear status after delay
    this.time.delayedCall(3000, () => {
      this.statusText.setText('');
    });
  }
  
  private checkActivityOverlap() {
    // This method is now handled by the handleInteraction method
    // Left for compatibility but functionality moved to handleInteraction
  }

  private performActivity(activity: string) {
    if (this.activityInProgress) return;
    
    this.activityInProgress = true;
    this.statusText.setText(`Performing ${activity}...`);
    
    // Face the appropriate direction for the activity
    // This adds a nice touch of realism to the interactions
    
    // Simulate activity time
    this.time.delayedCall(2000, () => {
      this.activityInProgress = false;
      
      // Determine reward based on activity
      let itemId: number;
      let itemName: string;
      
      switch (activity) {
        case 'mining':
          const miningRandom = Math.random();
          if (miningRandom < 0.4) { itemId = 1; itemName = 'Rock'; }
          else if (miningRandom < 0.7) { itemId = 3; itemName = 'Iron Ore'; }
          else if (miningRandom < 0.9) { itemId = 4; itemName = 'Gold Ore'; }
          else { itemId = 5; itemName = 'Diamond'; }
          break;
        case 'fishing':
          itemId = 7;
          itemName = 'Raw Fish';
          break;
        case 'cooking':
          const cookingRandom = Math.random();
          if (cookingRandom < 0.6) { itemId = 8; itemName = 'Cooked Fish'; }
          else if (cookingRandom < 0.9) { itemId = 9; itemName = 'Bread'; }
          else { itemId = 10; itemName = 'Cake'; }
          break;
        case 'woodcutting':
          itemId = 2;
          itemName = 'Wood';
          break;
        default:
          itemId = 1;
          itemName = 'Rock';
      }
      
      this.statusText.setText(`You obtained ${itemName}!`);
      
      // Emit item obtained event
      EventBus.emit('item-obtained', { itemId, itemName, activity });
      
      // Clear status after delay
      this.time.delayedCall(2000, () => {
        this.statusText.setText('');
      });
    });
  }

  update() {
    // Clear interaction flags and text when not near objects
    if (!this.activityInProgress && !this.isInCombat) {
      let nearInteractable = false;
      this.interactiveObjects.children.entries.forEach(obj => {
        const sprite = obj as Phaser.Physics.Arcade.Sprite;
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          sprite.x, sprite.y
        );
        if (distance < 80) {
          nearInteractable = true;
        } else {
          sprite.setData('canInteract', false);
        }
      });
      
      if (!nearInteractable) {
        this.statusText.setText('');
      }
    }
  }
} 