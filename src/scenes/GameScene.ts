import Phaser from 'phaser'
import { CONTRACT_ADDRESS } from '../contracts/GameItems'

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite
  private moveTarget: { x: number; y: number } | null = null
  private moveSpeed = 100
  private rocks: Phaser.GameObjects.Group | null = null
  private localInventory: { [key: string]: number } = {}
  private inventoryDisplay: Phaser.GameObjects.Text | null = null
  private statusText: Phaser.GameObjects.Text | null = null
  private isMining = false

  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    this.createPlayerSprite()
    this.createRockSprite()
  }

  create() {
    this.createWorld()
    this.createPlayer()
    this.createRocks()
    this.setupInput()
    this.createUI()
    this.setupSmartWalletIntegration()
  }

  update() {
    this.handleMovement()
  }

  private createPlayerSprite() {
    this.add.graphics()
      .fillStyle(0x3498db)
      .fillCircle(16, 16, 15)
      .generateTexture('player', 32, 32)
  }

  private createRockSprite() {
    this.add.graphics()
      .fillStyle(0x95a5a6)
      .fillRect(0, 0, 24, 24)
      .fillStyle(0x7f8c8d)
      .fillRect(4, 4, 16, 16)
      .generateTexture('rock', 24, 24)
  }

  private createWorld() {
    const worldWidth = 800
    const worldHeight = 600
    
    this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x27ae60, 0.3)
    
    for (let x = 0; x < worldWidth; x += 50) {
      for (let y = 0; y < worldHeight; y += 50) {
        this.add.circle(x, y, 2, 0x2ecc71, 0.5)
      }
    }
  }

  private createPlayer() {
    this.player = this.add.sprite(400, 300, 'player')
    this.player.setOrigin(0.5)
    this.physics.add.existing(this.player)
    
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    playerBody.setCollideWorldBounds(true)
  }

  private createRocks() {
    this.rocks = this.add.group()
    
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(50, 750)
      const y = Phaser.Math.Between(50, 550)
      const rock = this.add.sprite(x, y, 'rock')
      
      rock.setInteractive()
      rock.on('pointerdown', () => this.attemptMining(rock))
      
      this.rocks.add(rock)
    }
  }

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const clickedOnRock = this.rocks?.children.entries.some(rock => {
        const bounds = (rock as Phaser.GameObjects.Sprite).getBounds()
        return bounds.contains(pointer.x, pointer.y)
      })
      
      if (!clickedOnRock) {
        this.moveTarget = { x: pointer.x, y: pointer.y }
      }
    })
  }

  private handleMovement() {
    if (!this.moveTarget) return

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.moveTarget.x,
      this.moveTarget.y
    )

    if (distance < 5) {
      this.moveTarget = null
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body
      playerBody.setVelocity(0, 0)
      return
    }

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      this.moveTarget.x,
      this.moveTarget.y
    )

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    playerBody.setVelocity(
      Math.cos(angle) * this.moveSpeed,
      Math.sin(angle) * this.moveSpeed
    )
  }

  private async attemptMining(rock: Phaser.GameObjects.Sprite) {
    if (this.isMining) return

    const playerDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      rock.x,
      rock.y
    )

    if (playerDistance > 50) {
      this.moveTarget = { x: rock.x, y: rock.y }
      return
    }

    // Check if Smart Wallet is available
    const smartWalletContext = this.getSmartWalletContext()
    if (!smartWalletContext?.isConnected || !smartWalletContext?.address) {
      this.updateStatus('Connect your smart wallet to mine NFTs!', '#e67e22')
      return
    }

    await this.mineOnBlockchain(rock, smartWalletContext)
  }

  private async mineOnBlockchain(rock: Phaser.GameObjects.Sprite, smartWalletContext: any) {
    try {
      this.isMining = true
      this.updateStatus('Mining... (Processing with Smart Wallet)', '#3498db')
      
      // Animate rock while mining
      rock.setTint(0x555555)
      this.tweens.add({
        targets: rock,
        alpha: 0.5,
        duration: 200
      })

      // For now, simulate the mining process since we don't have a full smart wallet contract integration
      // In a real implementation, you would use the smart wallet to interact with the contract
      this.updateStatus('Transaction sent! Waiting for confirmation...', '#e67e22')
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      this.updateStatus('Successfully mined 1 Rock NFT! ⛏️', '#2ecc71')
      
      // Update local inventory for immediate feedback
      this.localInventory['rock'] = (this.localInventory['rock'] || 0) + 1
      this.updateInventoryDisplay()
      
      // Refresh blockchain data
      await this.refreshBlockchainData(smartWalletContext)
      
      // Reset rock after delay
      this.time.delayedCall(3000, () => {
        rock.setTint(0xffffff)
        rock.setAlpha(1)
      })
      
    } catch (error: any) {
      console.error('Mining failed:', error)
      this.updateStatus('Mining failed: ' + (error.message || 'Unknown error'), '#e74c3c')
      
      // Reset rock immediately on error
      rock.setTint(0xffffff)
      rock.setAlpha(1)
    } finally {
      this.isMining = false
    }
  }

  private async refreshBlockchainData(smartWalletContext: any) {
    try {
      // For now, simulate blockchain data since we don't have full smart wallet integration
      // In a real implementation, you would fetch data from the blockchain using the smart wallet
      const mockStats = {
        level: 1,
        xp: this.localInventory['rock'] * 10 || 0,
        gameVersion: '1.0.0'
      }
      
      const mockInventory = {
        names: ['Rock', 'Gold', 'Diamond'],
        balances: [this.localInventory['rock'] || 0, 0, 0]
      }
      
      // Update display with blockchain data
      this.updateStatusWithStats(mockStats, mockInventory)
      this.updateInventoryFromBlockchain(mockInventory)
      
    } catch (error) {
      console.error('Failed to refresh blockchain data:', error)
    }
  }

  private updateStatusWithStats(stats: any, inventory: any) {
    const totalItems = inventory.balances.reduce((sum: number, balance: number) => sum + balance, 0)
    this.updateStatus(
      `Level ${stats.level} | XP: ${stats.xp} | Total Items: ${totalItems} | Game Version: ${stats.gameVersion}`, 
      '#2ecc71'
    )
  }

  private updateInventoryFromBlockchain(inventory: any) {
    const inventoryText = inventory.names
      .map((name: string, index: number) => {
        const balance = inventory.balances[index]
        return balance > 0 ? `${name}: ${balance}` : null
      })
      .filter((item: string | null) => item !== null)
      .join(', ')
    
    if (this.inventoryDisplay) {
      this.inventoryDisplay.setText(inventoryText || 'No items yet')
    }
  }

  private getSmartWalletContext() {
    // Access Smart Wallet context from global app state
    return (window as any).smartWalletContext
  }

  private setupSmartWalletIntegration() {
    // Listen for Smart Wallet context changes
    const checkSmartWallet = () => {
      const smartWalletContext = this.getSmartWalletContext()
      if (smartWalletContext?.isConnected && smartWalletContext?.address) {
        this.refreshBlockchainData(smartWalletContext)
      }
    }
    
    // Check every few seconds
    this.time.addEvent({
      delay: 5000,
      callback: checkSmartWallet,
      loop: true
    })
  }

  private createUI() {
    this.add.text(10, 10, 'NFT Mining Game', { fontSize: '18px', color: '#fff' })
    this.add.text(10, 35, 'Inventory:', { fontSize: '14px', color: '#fff' })
    
    this.inventoryDisplay = this.add.text(10, 55, 'Connect wallet to see inventory', { 
      fontSize: '12px', 
      color: '#ecf0f1'
    })
    
    this.statusText = this.add.text(10, 80, 'Click rocks to mine NFTs!', { 
      fontSize: '12px', 
      color: '#bdc3c7'
    })
  }

  private updateInventoryDisplay() {
    const inventoryText = Object.entries(this.localInventory)
      .map(([item, count]) => `${item}: ${count}`)
      .join(', ')
    
    if (this.inventoryDisplay) {
      this.inventoryDisplay.setText(inventoryText || 'No items yet')
    }
  }

  private updateStatus(message: string, color: string = '#bdc3c7') {
    if (this.statusText) {
      this.statusText.setText(message)
      this.statusText.setColor(color)
    }
  }
} 