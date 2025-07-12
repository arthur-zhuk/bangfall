import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Phaser from 'phaser';
import { EventBus } from './EventBus';
import { LumbridgeScene } from './scenes/LumbridgeScene';

export interface IRefPhaserGame {
  game: Phaser.Game | undefined;
  scene: Phaser.Scene | undefined;
}

interface PhaserGameProps {
  currentActiveScene?: (scene: Phaser.Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, PhaserGameProps>(
  ({ currentActiveScene }, ref) => {
    const game = useRef<Phaser.Game | undefined>(undefined);
    const phaserRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      game: game.current,
      scene: game.current?.scene.getScene('LumbridgeScene') as Phaser.Scene,
    }));

    useEffect(() => {
      if (game.current === undefined) {
        game.current = new Phaser.Game({
          type: Phaser.AUTO,
          width: 1024,
          height: 768,
          parent: phaserRef.current!,
          backgroundColor: '#87CEEB',
          audio: {
            disableWebAudio: true,
            noAudio: true
          },
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 }, // No gravity for top-down view
              debug: false,
            },
          },
          scene: [LumbridgeScene],
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        });
      }

      return () => {
        if (game.current) {
          game.current.destroy(true);
          game.current = undefined;
        }
      };
    }, []);

    useEffect(() => {
      EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
        if (currentActiveScene) {
          currentActiveScene(scene);
        }
      });

      return () => {
        EventBus.removeListener('current-scene-ready');
      };
    }, [currentActiveScene]);

    return <div ref={phaserRef} style={{ width: '100%', height: '100%' }} />;
  }
);

PhaserGame.displayName = 'PhaserGame'; 