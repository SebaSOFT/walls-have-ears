import WHEUtils from '../utils/WHEUtils';
import PlayerContext from './player/PlayerContext';
import SoundManager from './audio/SoundManager';
import HookManager from './hooks/HookManager';
import { getGame } from '../foundry/getGame';
import MufflingCalculatorService from './services/MufflingCalculatorService';

/**
 * The main class that orchestrates the Walls Have Ears module.
 * It initializes and coordinates the different services and managers.
 */
export default class WHEFramework {
  private static instance: WHEFramework;

  private readonly _playerContext: PlayerContext;
  private readonly _soundManager: SoundManager;

  private constructor() {
    this._playerContext = PlayerContext.getInstance();
    this._soundManager = SoundManager.getInstance();
  }

  /**
   * Gets the singleton instance of the WHEFramework.
   * @returns {WHEFramework} The singleton instance.
   */
  public static getInstance = () => {
    if (!WHEFramework.instance) {
      WHEFramework.instance = new WHEFramework();
    }
    return WHEFramework.instance;
  };

  /**
   * Gets the PlayerContext instance.
   * @returns {PlayerContext} The PlayerContext instance.
   */
  public getPlayerContext = (): PlayerContext => {
    return this._playerContext;
  };

  /**
   * Initializes the framework, setting up all the necessary components and registering hooks.
   */
  public initialize(): void {
    WHEUtils.log('WHEFramework initialize...');

    const hookManager = new HookManager(this);
    hookManager.registerHooks();

    WHEUtils.log('WHEFramework initialized.');
  }

  /**
   * Performs the main muffling logic.
   * It iterates through all ambient sounds on the canvas, calculates the muffling level for the current player token,
   * and applies the corresponding audio effect.
   */
  public performMuffling = async () => {
    const selectedToken = this._playerContext.getSelectedToken();
    if (!selectedToken) {
      return;
    }
    if (getGame().audio.locked) {
      return;
    }
    const earPosition = {
      x: selectedToken.center.x,
      y: selectedToken.center.y,
    } as foundry.canvas.Canvas.Point;

    const ambientSounds = getGame()!.canvas!.sounds!.placeables;
    if (ambientSounds && ambientSounds.length > 0) {
      for (let i = 0; i < ambientSounds.length; i++) {
        const currentAmbientSound: foundry.canvas.placeables.AmbientSound = ambientSounds[i];

        if (!currentAmbientSound.isAudible) {
          WHEUtils.log('Sound not Audible for (probably is just turned off)');
          continue;
        }
        if (currentAmbientSound.document.walls) {
          WHEUtils.log('Ignoring this sound, is constrained by walls');
          continue;
        }

        const soundPosition = {
          x: currentAmbientSound.center.x,
          y: currentAmbientSound.center.y,
        } as foundry.canvas.Canvas.Point;

        const distanceToSound = MufflingCalculatorService.getDIstanceBetweenPoints(earPosition, soundPosition);

        if (currentAmbientSound.document.radius < Math.floor(distanceToSound)) {
          continue;
        }

        const muffleIndex = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPosition, soundPosition);

        await this._soundManager.applyMuffling(currentAmbientSound, muffleIndex, selectedToken.id);
        getGame().audio.debug(`WHE | Dynamically muffled sound to level ${muffleIndex}.`);
      }
    }
  };
}
