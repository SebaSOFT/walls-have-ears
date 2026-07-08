import WHEUtils from '../../utils/WHEUtils';
import { MUFFLING_MAPPING, WHEConstants } from '../../utils/WHEConstants';
import PlayerContext from '../player/PlayerContext';
import { getGame } from '../../foundry/getGame';
import Effect = AmbientSoundDocument.Effect;
import MufflingCalculatorService from '../services/MufflingCalculatorService';
import WHESettings from '../../settings/WHESettings';
import RoomAcousticService from '../services/RoomAcousticService';
import RoomReverbEffect from './RoomReverbEffect';

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

    let finalMuffleIndex = muffleIndex;
    let delayTimeSeconds = 0;
    let feedbackGain = 0;
    let dampeningCutoff = 3000;
    let wetGain = 0;
    let dryGain = 1.0;

    const isEchoEnabled = WHESettings.getInstance().getBoolean(WHEConstants.SETTING_ECHO_ENABLE, false);
    const selectedToken = PlayerContext.getInstance().getSelectedToken();

    if (isEchoEnabled && selectedToken) {
      const rayCount = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_RAYS, 8);
      const threshold = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_EXTERIOR_THRESHOLD, 120);
      const maxFeedback = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_FEEDBACK, 0.5);
      dampeningCutoff = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_DAMPENING, 3000);

      const sourcePos = {
        x: ambientSound.x,
        y: ambientSound.y,
        z: (ambientSound.document as any).elevation?.bottom ?? (ambientSound.document as any).elevation ?? 0,
      };

      const listenerPos = {
        x: selectedToken.center.x,
        y: selectedToken.center.y,
        z: ((selectedToken.document.elevation as any)?.bottom ?? selectedToken.document.elevation ?? 0) + 6,
      };

      const soundRadius = (ambientSound as any).soundRadius || (ambientSound as any).radius || 100;

      const sRoom = RoomAcousticService.calculateRoomSize(sourcePos, soundRadius, rayCount, true);
      const lRoom = RoomAcousticService.calculateRoomSize(listenerPos, soundRadius, rayCount, false);
      const effectiveRoomSize = RoomAcousticService.getEffectiveRoomSize(sRoom, lRoom, threshold);

      if (effectiveRoomSize !== null) {
        feedbackGain = WHEUtils.clamp((effectiveRoomSize / threshold) * maxFeedback, 0.1, 0.95) ?? 0.5;

        let pathDistanceUnits: number | null = null;
        if (muffleIndex > 0) {
          pathDistanceUnits = RoomAcousticService.getReboundPathDistance(sourcePos, listenerPos, soundRadius, rayCount);
        } else {
          pathDistanceUnits = MufflingCalculatorService.getDistanceBetweenPoints(listenerPos, sourcePos);
        }

        if (pathDistanceUnits !== null) {
          const speedOfSound = 1125;
          delayTimeSeconds = WHEUtils.clamp(pathDistanceUnits / speedOfSound, 0.0, 1.5) ?? 0.05;

          if (muffleIndex > 0) {
            // Direct path blocked BUT rebound connects: bypass direct filter, dim dry gain, use wet gain
            finalMuffleIndex = 0;
            dryGain = 0.1;
            wetGain = 0.8;
            WHEUtils.log(
              `WHE | [SoundManager] Mutually Exclusive Acoustics for sound ${ambientSound.id}: APPLIES REVERBERATION (Muffling bypassed). Rebound path connected. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, dist=${pathDistanceUnits.toFixed(1)}, delay=${delayTimeSeconds.toFixed(3)}s, feedback=${feedbackGain.toFixed(2)}, dry=${dryGain.toFixed(2)}, wet=${wetGain}`,
            );
          } else {
            // Direct path open: no direct filter, dry gain 1.0, low wet gain
            finalMuffleIndex = 0;
            dryGain = 1.0;
            wetGain = 0.2;
            WHEUtils.log(
              `WHE | [SoundManager] Mutually Exclusive Acoustics for sound ${ambientSound.id}: APPLIES REVERBERATION (Muffling bypassed). Direct path open. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, dist=${pathDistanceUnits.toFixed(1)}, delay=${delayTimeSeconds.toFixed(3)}s, feedback=${feedbackGain.toFixed(2)}, dry=${dryGain.toFixed(2)}, wet=${wetGain}`,
            );
          }
        } else {
          // Direct path blocked and no rebound connects: apply direct muffling
          finalMuffleIndex = muffleIndex;
          dryGain = 1.0;
          wetGain = 0.0;
          WHEUtils.log(
            `WHE | [SoundManager] Mutually Exclusive Acoustics for sound ${ambientSound.id}: APPLIES MUFFLING (Reverberation disabled). No rebound path found. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, muffleIndex=${finalMuffleIndex}`,
          );
        }
      } else {
        // Outdoors: apply direct muffling, no reverb
        finalMuffleIndex = muffleIndex;
        dryGain = 1.0;
        wetGain = 0.0;
        WHEUtils.log(
          `WHE | [SoundManager] Mutually Exclusive Acoustics for sound ${ambientSound.id}: APPLIES MUFFLING (Reverberation disabled). Outdoor environment. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, muffleIndex=${finalMuffleIndex}`,
        );
      }
    } else {
      // Echoes disabled or no selected token: apply direct muffling, no reverb
      finalMuffleIndex = muffleIndex;
      dryGain = 1.0;
      wetGain = 0.0;
      WHEUtils.log(
        `WHE | [SoundManager] Mutually Exclusive Acoustics for sound ${ambientSound.id}: APPLIES MUFFLING (Reverberation disabled). Echoes disabled or no selected token. muffleIndex=${finalMuffleIndex}`,
      );
    }

    const mufflingLevel = MUFFLING_MAPPING[`level${finalMuffleIndex}`];
    const shouldMufflingChange = this.hasMufflingChanged(currentTokenId, ambientSound.id, mufflingLevel);

    if (shouldMufflingChange) {
      this.storeMufflingLevel(currentTokenId, ambientSound.id, mufflingLevel);
      const shouldBeMuffled = finalMuffleIndex > 0;
      const intensity = shouldBeMuffled ? mufflingLevel : 0;
      const type = shouldBeMuffled ? 'lowpass' : '';

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
      }
    }

    if (soundMediaSource.effects.length === 0) {
      ambientSound.initializeSoundSource();
    }

    if (soundMediaSource.effects.length > 0) {
      let reverbEffect = (soundMediaSource as any).roomReverbEffect;
      if (!reverbEffect) {
        if (!soundMediaSource.context) return;
        reverbEffect = new RoomReverbEffect(soundMediaSource.context as AudioContext);
        (soundMediaSource as any).roomReverbEffect = reverbEffect;

        const currentEffects = [...soundMediaSource.effects];
        currentEffects[1] = reverbEffect;
        (soundMediaSource as any).updateEffects(currentEffects);
      }

      reverbEffect.update({
        delayTime: delayTimeSeconds,
        feedback: feedbackGain,
        dampening: dampeningCutoff,
        wetGain: wetGain,
        dryGain: dryGain,
      });
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
    const doorMufflingEnabled = WHESettings.getInstance().getBoolean(WHEConstants.SETTING_DOOR_MUFFLING, true);

    // If there is no selected token or door muffling is disabled, just execute FVTT function
    if (!selectedToken || !doorMufflingEnabled) {
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
    const doorPosition = {
      x: wall.center.x,
      y: wall.center.y,
      z: (wall.document as any).elevation?.bottom ?? (wall.document as any).elevation ?? 0,
    } as any;
    const earPosition = {
      x: selectedToken.center.x,
      y: selectedToken.center.y,
      z: ((selectedToken.document.elevation as any)?.bottom ?? selectedToken.document.elevation ?? 0) + 6,
    } as any;
    const distanceToDoor = MufflingCalculatorService.getDistanceBetweenPoints(earPosition, doorPosition);
    if (distanceToDoor > wall.soundRadius) {
      return;
    }
    const muffIntensity = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPosition, doorPosition);
    const mufflingLevel = MUFFLING_MAPPING[`level${muffIntensity}`];

    // Play the door sound as a localized sound effect
    const muffledEffect = { type: 'lowpass', intensity: mufflingLevel };
    const isEchoEnabled = WHESettings.getInstance().getBoolean(WHEConstants.SETTING_ECHO_ENABLE, false);
    const soundLayer = getGame().canvas!.sounds!;
    soundLayer
      .playAtPosition(src, doorPosition, wall.soundRadius, {
        volume: 1.0,
        easing: true,
        walls: false,
        gmAlways: true,
        muffledEffect: muffledEffect as unknown as Effect,
      })
      .then((soundInstance: any) => {
        if (soundInstance && isEchoEnabled && selectedToken) {
          const rayCount = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_RAYS, 8);
          const threshold = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_EXTERIOR_THRESHOLD, 120);
          const maxFeedback = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_FEEDBACK, 0.5);
          const dampeningCutoff = WHESettings.getInstance().getNumber(WHEConstants.SETTING_ECHO_DAMPENING, 3000);

          const soundRadius = wall.soundRadius || 100;

          const sRoom = RoomAcousticService.calculateRoomSize(doorPosition, soundRadius, rayCount, true);
          const lRoom = RoomAcousticService.calculateRoomSize(earPosition, soundRadius, rayCount, false);
          const effectiveRoomSize = RoomAcousticService.getEffectiveRoomSize(sRoom, lRoom, threshold);

          if (effectiveRoomSize !== null) {
            let delayTimeSeconds = 0;
            let feedbackGain = 0;
            let wetGain = 0;
            let dryGain = 1.0;

            feedbackGain = WHEUtils.clamp((effectiveRoomSize / threshold) * maxFeedback, 0.1, 0.95) ?? 0.5;

            let pathDistanceUnits: number | null = null;
            if (muffIntensity > 0) {
              pathDistanceUnits = RoomAcousticService.getReboundPathDistance(
                doorPosition,
                earPosition,
                soundRadius,
                rayCount,
              );
            } else {
              pathDistanceUnits = distanceToDoor;
            }

            if (pathDistanceUnits !== null) {
              const speedOfSound = 1125;
              delayTimeSeconds = WHEUtils.clamp(pathDistanceUnits / speedOfSound, 0.0, 1.5) ?? 0.05;

              if (muffIntensity > 0) {
                // Direct path blocked BUT rebound connects: bypass direct filter, dim dry gain, use wet gain
                dryGain = 0.1;
                wetGain = 0.8;

                const firstEffect = soundInstance.effects[0];
                if (firstEffect) {
                  firstEffect.update({ type: '', intensity: 0 });
                }
                WHEUtils.log(
                  `WHE | [SoundManager] Mutually Exclusive Acoustics for door sound: APPLIES REVERBERATION (Muffling bypassed). Rebound path connected. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, dist=${pathDistanceUnits.toFixed(1)}, delay=${delayTimeSeconds.toFixed(3)}s, feedback=${feedbackGain.toFixed(2)}, dry=${dryGain.toFixed(2)}, wet=${wetGain}`,
                );
              } else {
                dryGain = 1.0;
                wetGain = 0.2;
                WHEUtils.log(
                  `WHE | [SoundManager] Mutually Exclusive Acoustics for door sound: APPLIES REVERBERATION (Muffling bypassed). Direct path open. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, dist=${pathDistanceUnits.toFixed(1)}, delay=${delayTimeSeconds.toFixed(3)}s, feedback=${feedbackGain.toFixed(2)}, dry=${dryGain.toFixed(2)}, wet=${wetGain}`,
                );
              }

              const reverbEffect = new RoomReverbEffect(soundInstance.context);
              reverbEffect.update({
                delayTime: delayTimeSeconds,
                feedback: feedbackGain,
                dampening: dampeningCutoff,
                wetGain: wetGain,
                dryGain: dryGain,
              });

              const currentEffects = [...soundInstance.effects];
              currentEffects[1] = reverbEffect;
              soundInstance.updateEffects(currentEffects);
            } else {
              // Direct path blocked and no rebound connects: apply direct muffling
              WHEUtils.log(
                `WHE | [SoundManager] Mutually Exclusive Acoustics for door sound: APPLIES MUFFLING (Reverberation disabled). No rebound path found. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, muffleIndex=${muffIntensity}`,
              );
            }
          } else {
            // Outdoors: apply direct muffling, no reverb
            WHEUtils.log(
              `WHE | [SoundManager] Mutually Exclusive Acoustics for door sound: APPLIES MUFFLING (Reverberation disabled). Outdoor environment. S_room=${sRoom.toFixed(1)}, L_room=${lRoom.toFixed(1)}, muffleIndex=${muffIntensity}`,
            );
          }
        } else {
          // Echoes disabled or no selected token: apply direct muffling, no reverb
          WHEUtils.log(
            `WHE | [SoundManager] Mutually Exclusive Acoustics for door sound: APPLIES MUFFLING (Reverberation disabled). Echoes disabled or no selected token. muffleIndex=${muffIntensity}`,
          );
        }
      });
  };
}
