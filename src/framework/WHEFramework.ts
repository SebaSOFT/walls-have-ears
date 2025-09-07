import WHEUtils from '../utils/WHEUtils';
import { MUFFLING_MAPPING, WHEConstants } from '../utils/WHEConstants';
import { getGame } from '../foundry/getGame';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { libWrapper } from '../lib/libWrapper';
import Effect = AmbientSoundDocument.Effect;

/**
 * Options for the getActingToken method.
 */
interface GetActingTokenOptions {
  /** An actor to find a token for. */
  actor?: foundry.documents.Actor;
  /** If true, show a warning notification if multiple tokens are found. */
  warn?: boolean;
  /** If true, only consider tokens that are linked to their actor. */
  linked?: boolean;
}

export default class WHEFramework {
  private static instance: WHEFramework;

  private selectedToken: foundry.canvas.placeables.Token | null = null;

  private constructor() {}

  public static getInstance = () => {
    if (!WHEFramework.instance) {
      WHEFramework.instance = new WHEFramework();
    }
    return WHEFramework.instance;
  };

  public initialize(): void {
    WHEUtils.log('WHEFramework initialize...');
    // ---------- H O O K S ---------- //
    // Hook wen the scene is ready
    Hooks.on('ready', async () => {
      await getGame().audio.awaitFirstGesture();

      WHEFramework.getInstance().performMuffling();

      libWrapper.register(
        WHEConstants.MODULE,
        'foundry.canvas.placeables.Wall.prototype._playDoorSound',
        // Wee need an annonymous function here, to get the THIS
        function (wrapped: (interaction: string) => void, args: any) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          const wall = this as foundry.canvas.placeables.Wall;
          WHEFramework.getInstance().playDoorSound(wrapped, args, wall);
          return;
        },
        'MIXED',
      );
    });
    // When a token is about to be moved
    Hooks.on('updateToken', (_token, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateToken');
      WHEFramework.getInstance().performMuffling();
    });
    // When a Door is about to be opened
    Hooks.on('updateWall', (_token, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateWall');
      WHEFramework.getInstance().performMuffling();
    });
    // When ambient sound is about to be moved
    Hooks.on('preUpdateAmbientSound', (ambientSound, formData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: preUpdateAmbientSound', formData);
      const aSound = ambientSound as foundry.documents.AmbientSoundDocument;
      if (aSound.effects.muffled.type !== 'lowpass') {
        aSound.effects.muffled.type = 'lowpass';
        aSound.effects.muffled.intensity = 0;
        aSound.update({
          effects: {
            muffled: { type: 'lowpass', intensity: 0 },
          },
        });
      }
    });
    // When ambient sound is about to be moved
    Hooks.on('updateAmbientSound', (ambientSound, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateAmbientSound', _updateData);
      const aSound = ambientSound as foundry.documents.AmbientSoundDocument;
      aSound.update({
        effects: {
          muffled: { type: 'lowpass', intensity: 0 },
        },
      });
      aSound.effects.muffled.type = 'lowpass';
      aSound.effects.muffled.intensity = 0;
      WHEFramework.getInstance().performMuffling();
    });
    // When the user starts controlling a token
    Hooks.on('controlToken', async (token, selected) => {
      await WHEFramework.getInstance().checkForChangedSelection(token, selected);
      WHEFramework.getInstance().performMuffling();
    });
    Hooks.on('closeAmbientSoundConfig', (_soundConfig) => {
      WHEUtils.log('WHEFramework Event: closeAmbientSoundConfig');
      WHEFramework.getInstance().performMuffling();
    });
    Hooks.on('renderAmbientSoundConfig', (_app, html, _data, _options) => {
      WHEFramework.getInstance().modifySoundConfigForm(html);
    });
    // ---------- H O O K S ---------- //

    WHEUtils.log('WHEFramework initialized.');
  }

  /**
   * Interrupts the Wall._playDoorSound function toexecute the sound with a dynamic muffling sound
   *
   * @param wrapped The original functionto execute if there is no token selected
   * @param interaction The type of sound to be played
   * @param wall The wall object (door) that will play this button
   */
  public playDoorSound = (
    wrapped: (intWrapper: string) => void,
    interaction: 'open' | 'close' | 'lock' | 'unlock' | 'test',
    wall: Wall,
  ) => {
    // If there is no selected token, just execute FVTT function
    if (!this.selectedToken) {
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

  /**
   * Modifies the Ambient Sound config form to hide the muffling effect and set the warning
   * @param html The HTMLElement object that corresponds to the Ambient Sound config form
   */
  public modifySoundConfigForm = (html: HTMLElement) => {
    const fieldSets = html.getElementsByTagName('fieldset');
    let foundFields = false;
    for (let i = 0; i < fieldSets.length; i++) {
      const fieldset = fieldSets.item(i);
      if (fieldset) {
        const fields = fieldset.getElementsByClassName('form-group');
        for (let j = 0; j < fields.length; j++) {
          const fieldGroup = fields.item(j);
          const field = fieldGroup?.getHTML();
          if (field?.indexOf('"effects.muffled.type"') !== -1) {
            fieldGroup?.setAttribute('style', 'display:none;');
            foundFields = true;
          }
          if (field?.indexOf('"effects.muffled.intensity"') !== -1) {
            fieldGroup?.setAttribute('style', 'display:none;');
            foundFields = true;
          }
        }
        if (foundFields) {
          const hints = fieldset.getElementsByClassName('hint');
          const lastHint = hints.item(hints.length - 1);
          if (lastHint) {
            const warningText = WHEUtils.getMessageText('WHE.config.hint');
            lastHint.innerHTML = `<i>${warningText}</i>`;
          }
          break;
        }
      }
    }
  };

  /**
   * When a selection has been changed, we need to figure out why, is this unselected? Is more than one selected, is the token mine?
   * @param token the token that has started to get controlled
   * @param selected is the token acutally selected here?
   */
  public checkForChangedSelection = async (token: foundry.canvas.placeables.Token, selected: boolean) => {
    if (!selected) {
      WHEUtils.log('No token selected but getting from user');
      this.selectedToken = this.getActingToken({
        actor: getGame().user!.character ?? undefined,
      });
    } else {
      WHEUtils.log('Token Selected so it should be yours');
      this.selectedToken = token;
    }
  };

  /**
   * Loops through the sounds in the scene and estimate if its audible and the eventual
   * muffling index, after estimate that, applies the audio filter correspondingly
   */
  public performMuffling = () => {
    if (!this.selectedToken) {
      return;
    }
    if (getGame().audio.locked) {
      return;
    }
    const earPosition = {
      x: this.selectedToken.center.x,
      y: this.selectedToken.center.y,
    } as foundry.canvas.Canvas.Point;

    const currentTokenId = this.selectedToken.id;

    const ambientSounds = getGame()!.canvas!.sounds!.placeables;
    if (ambientSounds && ambientSounds.length > 0) {
      for (let i = 0; i < ambientSounds.length; i++) {
        /**
         * @type  foundry.canvas.placeables.AmbientSound
         */
        const currentAmbientSound: foundry.canvas.placeables.AmbientSound = ambientSounds[i];
        WHEUtils.log('Ambient Sound', currentAmbientSound);
        const ambienSoundSource = currentAmbientSound.source;
        const soundMediaSource = currentAmbientSound.sound;
        WHEUtils.log('Ambient Source', ambienSoundSource);
        WHEUtils.log('Sound Source', soundMediaSource);
        WHEUtils.log('Sound Doc', currentAmbientSound.document);
        if (!soundMediaSource) {
          WHEUtils.log('Sound is not loaded in the ambient sound, maybe a FVTT bug');
          continue;
        }

        // Added in 0.8.x for Darkness range setting
        if (!currentAmbientSound.isAudible) {
          WHEUtils.log('Sound not Audible for (probably is just turned off)');
          continue;
        }
        if (currentAmbientSound.document.walls) {
          WHEUtils.log('Ignoring this sound, is constrained by walls');
          // TODO set muffling to zero
          continue;
        }
        const currentSoundId = currentAmbientSound.id;

        const currentSoundRadius = currentAmbientSound.document.radius;
        const soundPosition = {
          x: currentAmbientSound.center.x,
          y: currentAmbientSound.center.y,
        } as foundry.canvas.Canvas.Point;

        const distanceToSound = this.getDIstanceBetweenPoints(earPosition, soundPosition);
        WHEUtils.log(`Sound `, ambienSoundSource, currentSoundRadius, distanceToSound);

        if (currentSoundRadius < Math.floor(distanceToSound)) {
          continue;
        }

        const muffleIndex = this.getMufflingIndexBetweenPoints(earPosition, soundPosition);
        WHEUtils.log(`Muffle Index `, muffleIndex);
        WHEUtils.log(`Mapped Muffle Index `, MUFFLING_MAPPING[`level${muffleIndex}`]);

        const shouldBeMuffled = muffleIndex >= 1;
        const shouldMufflingChange = this.hasMufflingChanged(
          currentTokenId,
          currentSoundId,
          MUFFLING_MAPPING[`level${muffleIndex}`],
        );

        if (muffleIndex < 0 && !shouldMufflingChange) {
          WHEUtils.log(`AmbientSound `, currentAmbientSound, soundMediaSource);
          continue;
        }

        // Caching muffling values to avoid changing filters if not needed
        if (shouldMufflingChange) {
          this.storeMufflingLevel(currentTokenId, currentSoundId, MUFFLING_MAPPING[`level${muffleIndex}`]);

          WHEUtils.log('Token and Sound IDs: ', currentTokenId, currentSoundId);
          WHEUtils.log('Sources: ', soundMediaSource, ambienSoundSource);
          // Muufle as needed
          if (shouldBeMuffled) {
            WHEUtils.log('Muffling to: ', MUFFLING_MAPPING[`level${muffleIndex}`]);
            currentAmbientSound.document.effects.muffled.type = 'lowpass';
            currentAmbientSound.document.effects.muffled.intensity = MUFFLING_MAPPING[`level${muffleIndex}`];

            if (soundMediaSource.effects.length == 0) {
              currentAmbientSound.sync(currentAmbientSound.isAudible, currentAmbientSound.document.volume, {
                muffled: true,
              });
              currentAmbientSound.initializeSoundSource();
            } else {
              const effect = soundMediaSource.effects[0] as foundry.audio.BiquadFilterEffect;
              effect.update({
                type: 'lowpass',
                intensity: MUFFLING_MAPPING[`level${muffleIndex}`],
              });
              WHEUtils.log('*** UPDATED EFFECT***', effect.intensity);
            }
          } else {
            WHEUtils.log('Should not be muffled');
            currentAmbientSound.document.effects.muffled.type = '';
            currentAmbientSound.document.effects.muffled.intensity = 0;
            if (soundMediaSource.effects.length == 0) {
              currentAmbientSound.sync(currentAmbientSound.isAudible, currentAmbientSound.document.volume, {
                muffled: false,
              });
              currentAmbientSound.initializeSoundSource();
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
      }
    }

    //DO THA MUFFLING
    getGame().audio.debug('WHE | Dynamically muffled sound to level X');
  };

  private storeMufflingLevel = (currentTokenId: string, currentSoundId: string, muffleIndex: number) => {
    WHEUtils.setCachedItem(`token-${currentTokenId}-sound-${currentSoundId}`, muffleIndex);
  };
  private hasMufflingChanged = (currentTokenId: string, currentSoundId: string, muffleIndex: number): boolean => {
    const cachedValue = WHEUtils.getCachedItem(`token-${currentTokenId}-sound-${currentSoundId}`);
    WHEUtils.log('Index Saved', cachedValue);
    WHEUtils.log('Index Tested', muffleIndex);
    return cachedValue !== muffleIndex;
  };

  private getMufflingIndexBetweenPoints = (
    earPosition: foundry.canvas.Canvas.Point,
    soundPosition: foundry.canvas.Canvas.Point,
  ): number => {
    const sightLayer = CONFIG.Canvas.polygonBackends.sight;
    const soundLayer = CONFIG.Canvas.polygonBackends.sound;
    const moveLayer = CONFIG.Canvas.polygonBackends.move;

    // First, there should not be any sound interruption
    const hasSoundOccluded = soundLayer.testCollision(earPosition, soundPosition, { type: 'sound', mode: 'any' });

    if (!hasSoundOccluded) {
      WHEUtils.log('This sound has no walls, direct access', hasSoundOccluded);
      return -1;
    }

    // If you don't see it, it's muffled
    let sightCollisions = sightLayer.testCollision(earPosition, soundPosition, { type: 'sight', mode: 'all' });

    if (!sightCollisions) {
      WHEUtils.log('There are no walls!');
      return -1;
    }

    // New windows come by default with a distance triggering of the sight,
    // which we need to filter to keep (available) windows as 0 muffling
    sightCollisions = sightCollisions.filter((impactVertex) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const wall = impactVertex.edges.first().object as Wall;

      const wallCenter = wall.center;

      const sightDistance = wall.document.threshold.sight;
      if (!sightDistance) {
        return true;
      }
      const tokenDistance = this.getDIstanceBetweenPoints(earPosition, wallCenter);

      WHEUtils.log(`Maximum sight: ${sightDistance}`);
      WHEUtils.log(`Distance to Wall: ${tokenDistance}`);
      // If token is close to the window it should be open and not represent a sight collision
      return tokenDistance >= sightDistance;
    });

    // Then again if terrain collisions exist, you are in the same room
    const noTerrainSenseCollisions = sightCollisions.filter((impactVertex) => {
      const wall = impactVertex?.edges?.first()?.isLimited('sight');
      return !wall;
    });

    // This already takes into account open doors
    const moveCollisions = moveLayer.testCollision(earPosition, soundPosition, { type: 'move', mode: 'all' });

    // Present the results
    WHEUtils.log(`Collision walls (MOVE): ${moveCollisions.length}`);
    WHEUtils.log(`Collision walls (SIGHT): ${sightCollisions.length}`);
    WHEUtils.log(`Collision walls (SIGHT excl. terrain ): ${noTerrainSenseCollisions.length}`);

    // Estimating how much to muffle
    // See image:
    const finalMuffling = Math.floor((noTerrainSenseCollisions.length + moveCollisions.length) / 2);

    // Account for ethereal walls
    if (sightCollisions.length >= 1 && moveCollisions.length === 0) {
      WHEUtils.log('There is at least an ethereal wall');
      return 0;
    }

    return WHEUtils.clamp(finalMuffling, 0, 5) ?? 0;
  };

  private getDIstanceBetweenPoints = (
    poinA: foundry.canvas.Canvas.Point,
    pointB: foundry.canvas.Canvas.Point,
  ): number => {
    const horizontalDistance = getGame()!.canvas!.grid!.measurePath([poinA, pointB], {}).distance;

    // TODO meassure elevation
    //const elevationDiff = Math.abs(token.document.elevation - target.document.elevation);
    //const trueDistance = Math.round(Math.hypot(horizontalDistance, elevationDiff));

    WHEUtils.log('Horizontal Distance: ', horizontalDistance);

    return horizontalDistance;
  };

  /**
   * Gets the single acting token based on the provided options.
   * This could be a token controlled by the user, or a token associated with a specific actor.
   *
   * @param {GetActingTokenOptions} options - The options for getting the token.
   * @returns {foundry.canvas.placeables.Token | null} The token object or null if no single token is found.
   */
  private getActingToken = ({
    actor = undefined,
    warn = false,
    linked = false,
  }: GetActingTokenOptions = {}): foundry.canvas.placeables.Token | null => {
    const tokenLayer: TokenLayer | null = getGame().canvas!.tokens ?? null;
    if (!tokenLayer) {
      return null;
    }

    let potentialTokens: foundry.canvas.placeables.Token[];

    if (actor) {
      const controlledTokens = tokenLayer.controlled;
      if (controlledTokens.length > 0) {
        potentialTokens = controlledTokens.filter(
          (token) => token.actor?.id === actor.id && (!linked || token.document.actorLink),
        );
      } else {
        potentialTokens = actor.getActiveTokens();
        if (linked) {
          potentialTokens = potentialTokens.filter((token) => token.document.actorLink);
        }
      }
    } else {
      potentialTokens = [...tokenLayer.controlled];
      if (potentialTokens.length === 0 && getGame().user!.character) {
        // getActiveTokens returns an array of Token objects
        potentialTokens = getGame().user!.character!.getActiveTokens();
      }
    }

    if (potentialTokens.length > 1) {
      if (warn) {
        ui.notifications?.warn('WHE: Multiple possible acting tokens found. Please select a single token.');
      }
      return null;
    }

    return potentialTokens[0] ?? null;
  };
}
