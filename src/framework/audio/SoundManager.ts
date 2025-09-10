import WHEUtils from '../../utils/WHEUtils';
import { MUFFLING_MAPPING } from '../../utils/WHEConstants';
import PlayerContext from '../player/PlayerContext';
import { getGame } from '../../foundry/getGame';
import Effect = AmbientSoundDocument.Effect;
import MufflingCalculatorService from '../services/MufflingCalculatorService';

const AWAIT_SOUND_TIMEOUT_MS = 2000;
const AWAIT_SOUND_POLL_INTERVAL_MS = 50;

const awaitSound = (ambientSound: foundry.canvas.placeables.AmbientSound): Promise<foundry.audio.Sound | null> => {
  return new Promise((resolve) => {
    let elapsed = 0;
    const timer = setInterval(() => {
      if (ambientSound.sound) {
        clearInterval(timer);
        resolve(ambientSound.sound);
      }
      elapsed += AWAIT_SOUND_POLL_INTERVAL_MS;
      if (elapsed >= AWAIT_SOUND_TIMEOUT_MS) {
        clearInterval(timer);
        resolve(null);
      }
    }, AWAIT_SOUND_POLL_INTERVAL_MS);
  });
};
/**
 * Manages all audio-related functionality, including applying muffling effects and handling special sounds like doors.
 */
export default class SoundManager {
  private static instance: SoundManager;

  private constructor() {}

  /**
   * Gets the singleton instance of the SoundManager.
   * @returns {SoundManager} The singleton instance.
   */
  public static getInstance = () => {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  };

  /**
   * Caches the muffling level for a specific token-sound pair.
   * @param {string} currentTokenId - The ID of the token.
   * @param {string} currentSoundId - The ID of the sound.
   * @param {number} muffleIndex - The muffling level to cache.
   */
  public storeMufflingLevel = (currentTokenId: string, currentSoundId: string, muffleIndex: number) => {
    WHEUtils.setCachedItem(`token-${currentTokenId}-sound-${currentSoundId}`, muffleIndex);
  };

  /**
   * Checks if the muffling level for a token-sound pair has changed from the cached value.
   * @param {string} currentTokenId - The ID of the token.
   * @param {string} currentSoundId - The ID of the sound.
   * @param {number} muffleIndex - The new muffling level to check against the cache.
   * @returns {boolean} True if the level has changed, false otherwise.
   */
  public hasMufflingChanged = (currentTokenId: string, currentSoundId: string, muffleIndex: number): boolean => {
    const cachedValue = WHEUtils.getCachedItem(`token-${currentTokenId}-sound-${currentSoundId}`);
    WHEUtils.log('Index Saved', cachedValue);
    WHEUtils.log('Index Tested', muffleIndex);
    return cachedValue !== muffleIndex;
  };

  /**
   * Applies the muffling effect to a given ambient sound based on the calculated index.
   * It checks the cache to avoid unnecessary updates.
   * @param {foundry.canvas.placeables.AmbientSound} ambientSound - The ambient sound to modify.
   * @param {number} muffleIndex - The calculated muffling index (0-5).
   * @param {string} currentTokenId - The ID of the listening token, for caching purposes.
   */
  public applyMuffling = async (
    ambientSound: foundry.canvas.placeables.AmbientSound,
    muffleIndex: number,
    currentTokenId: string,
  ) => {
    const soundMediaSource = ambientSound.sound ?? (await awaitSound(ambientSound));
    if (!soundMediaSource) {
      WHEUtils.log(`Sound for ambient sound ${ambientSound.id} not loaded after waiting.`);
      return;
    }

    const mufflingLevel = MUFFLING_MAPPING[`level${muffleIndex}`];
    const shouldMufflingChange = this.hasMufflingChanged(currentTokenId, ambientSound.id, mufflingLevel);

    if (muffleIndex < 0 && !shouldMufflingChange) {
      WHEUtils.log(`AmbientSound `, ambientSound, soundMediaSource);
      return;
    }

    if (shouldMufflingChange) {
      this.storeMufflingLevel(currentTokenId, ambientSound.id, mufflingLevel);
      const shouldBeMuffled = muffleIndex > 0;

      const intensity = shouldBeMuffled ? mufflingLevel : 0;
      const type = shouldBeMuffled ? 'lowpass' : '';

      WHEUtils.log(shouldBeMuffled ? `Muffling to: ${intensity}` : 'Should not be muffled');
      ambientSound.document.effects.muffled.type = type;
      ambientSound.document.effects.muffled.intensity = intensity;

      if (soundMediaSource.effects.length === 0) {
        ambientSound.sync(ambientSound.isAudible, ambientSound.document.volume, {
          muffled: shouldBeMuffled,
        });
        ambientSound.initializeSoundSource();
      } else {
        const effect = soundMediaSource.effects[0] as foundry.audio.BiquadFilterEffect;
        effect.update({
          type: 'lowpass',
          intensity: intensity,
        });
        WHEUtils.log('*** UPDATED EFFECT***', effect.intensity);
      }
    } else {
      WHEUtils.log('Cached muffling level WILL NOT change filter');
    }
  };

  /**
   * Intercepts the Wall._playDoorSound function to execute the sound with a dynamic muffling sound if a token is selected.
   * @param {function} wrapped - The original function to execute if there is no token selected.
   * @param {'open' | 'close' | 'lock' | 'unlock' | 'test'} interaction - The type of sound to be played.
   * @param {Wall} wall - The wall object (door) that will play this sound.
   */
  public playDoorSound = (
    wrapped: (intWrapper: string) => void,
    interaction: 'open' | 'close' | 'lock' | 'unlock' | 'test',
    wall: Wall,
  ) => {
    const selectedToken = PlayerContext.getInstance().getSelectedToken();
    // If there is no selected token, just execute FVTT function
    if (!selectedToken) {
      WHEUtils.log('Executing regular playDoorSound');
      wrapped(interaction);
      return;
    }

    WHEUtils.log('Executing WHE enhaced playDoorSound');
    // Copy of FVTT code
    if (!CONST.WALL_DOOR_INTERACTIONS.includes(interaction)) {
      throw new Error(`"${interaction}" is not a valid door interaction type`);
    }
    if (!wall.isDoor) {
      return;
    }
    // Identify which door sound effect to play
    const doorSound = CONFIG.Wall.doorSounds[wall.document.doorSound as any];
    let sounds = doorSound?.[interaction];
    if (sounds && !Array.isArray(sounds)) sounds = [sounds];
    else if (!sounds?.length) {
      if (interaction !== 'test') {
        return;
      }
      sounds = [CONFIG.sounds.lock];
    }
    const src = sounds[Math.floor(Math.random() * sounds.length)];

    // This is the different about WHE, here we dinamically estimate the mufling
    const doorPosition = wall.center;
    const earPosition = selectedToken.center;
    const distanceToDoor = MufflingCalculatorService.getDIstanceBetweenPoints(earPosition, doorPosition);
    if (distanceToDoor > wall.soundRadius) {
      return;
    }
    const muffIntensity = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPosition, doorPosition);
    const mnufflinglevel = MUFFLING_MAPPING[`level${muffIntensity}`];

    // Play the door sound as a localized sound effect
    const muffledEffect = { type: 'lowpass', intensity: mnufflinglevel };
    const soundLayer = getGame().canvas!.sounds!;
    soundLayer
      .playAtPosition(src, doorPosition, wall.soundRadius, {
        volume: 1.0,
        easing: true,
        walls: false,
        gmAlways: true,
        muffledEffect: muffledEffect as unknown as Effect,
      })
      .then();
  };
}
