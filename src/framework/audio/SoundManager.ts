import WHEUtils from '../../utils/WHEUtils';
import { MUFFLING_MAPPING } from '../../utils/WHEConstants';
import PlayerContext from '../player/PlayerContext';
import { getGame } from '../../foundry/getGame';
import Effect = AmbientSoundDocument.Effect;

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
   * @param {foundry.canvas.placeables.AmbientSound} sound - The ambient sound to modify.
   * @param {number} muffleIndex - The calculated muffling index (0-5).
   * @param {string} currentTokenId - The ID of the listening token, for caching purposes.
   */
  public applyMuffling = (
    sound: foundry.canvas.placeables.AmbientSound,
    muffleIndex: number,
    currentTokenId: string,
  ) => {
    const soundMediaSource = sound.sound;
    if (!soundMediaSource) {
      WHEUtils.log('Sound is not loaded in the ambient sound, maybe a FVTT bug');
      return;
    }

    const mufflingLevel = MUFFLING_MAPPING[`level${muffleIndex}`];
    const shouldMufflingChange = this.hasMufflingChanged(currentTokenId, sound.id, mufflingLevel);

    if (muffleIndex < 0 && !shouldMufflingChange) {
      WHEUtils.log(`AmbientSound `, sound, soundMediaSource);
      return;
    }

    if (shouldMufflingChange) {
      this.storeMufflingLevel(currentTokenId, sound.id, mufflingLevel);
      const shouldBeMuffled = muffleIndex >= 1;

      if (shouldBeMuffled) {
        WHEUtils.log('Muffling to: ', mufflingLevel);
        sound.document.effects.muffled.type = 'lowpass';
        sound.document.effects.muffled.intensity = mufflingLevel;

        if (soundMediaSource.effects.length == 0) {
          sound.sync(sound.isAudible, sound.document.volume, {
            muffled: true,
          });
          sound.initializeSoundSource();
        } else {
          const effect = soundMediaSource.effects[0] as foundry.audio.BiquadFilterEffect;
          effect.update({
            type: 'lowpass',
            intensity: mufflingLevel,
          });
          WHEUtils.log('*** UPDATED EFFECT***', effect.intensity);
        }
      } else {
        WHEUtils.log('Should not be muffled');
        sound.document.effects.muffled.type = '';
        sound.document.effects.muffled.intensity = 0;
        if (soundMediaSource.effects.length == 0) {
          sound.sync(sound.isAudible, sound.document.volume, {
            muffled: false,
          });
          sound.initializeSoundSource();
        } else {
          const effect = soundMediaSource.effects[0] as foundry.audio.BiquadFilterEffect;
          effect.update({
            type: 'lowpass',
            intensity: 0,
          });
          WHEUtils.log('*** UPDATED EFFECT***', effect.intensity);
        }
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
    if (!wall.isDoor) return;
    // Identify which door sound effect to play
    const doorSound = CONFIG.Wall.doorSounds[wall.document.doorSound as any];
    let sounds = doorSound?.[interaction];
    if (sounds && !Array.isArray(sounds)) sounds = [sounds];
    else if (!sounds?.length) {
      if (interaction !== 'test') return;
      sounds = [CONFIG.sounds.lock];
    }
    const src = sounds[Math.floor(Math.random() * sounds.length)];

    // This is the different about WHE, here we dinamically estimate the mufling
    const muffIntensity = 5;

    // Play the door sound as a localized sound effect
    const muffledEffect = { type: 'lowpass', intensity: muffIntensity };
    const soundLayer = getGame().canvas!.sounds!;
    soundLayer
      .playAtPosition(src, wall.center, wall.soundRadius, {
        volume: 1.0,
        easing: true,
        walls: false,
        gmAlways: true,
        muffledEffect: muffledEffect as unknown as Effect,
      })
      .then();
  };
}
