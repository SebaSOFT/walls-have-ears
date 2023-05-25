/* eslint-disable no-unused-vars */
import WHE from "./WHE.js";

window.WHE = window.WHE || WHE;

let debugEnabled = false;
let wallsSoundsDisabled = true;
let listenerToken = null;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/* ------------------------------------ */
// Initialize module
/* ------------------------------------ */
Hooks.once("init", async function() {
  WHE.logMessage("Initializing walls have ears");

  // Register custom sheets (if any)

  WHE.logMessage("init finished");
});

/* ------------------------------------ */
// Setup module
/* ------------------------------------ */
Hooks.once("setup", function() {
  WHE.logMessage("module setup started");

  // Do anything after initialization but before ready

  // Get User Options
  wallsSoundsDisabled = game.settings.get(WHE.MODULE, WHE.SETTING_DISABLE);
  debugEnabled = game.settings.get(WHE.MODULE, WHE.SETTING_DEBUG);
  WHE.debug = debugEnabled;

  WHE.logMessage("module setup finished");
});

/* ------------------------------------ */
// Settings changed
/* ------------------------------------ */
Hooks.on("closeSettingsConfig", function() {
  WHE.logMessage("updateToken called");

  // Get User Options
  wallsSoundsDisabled = game.settings.get(WHE.MODULE, WHE.SETTING_DISABLE);
  debugEnabled = game.settings.get(WHE.MODULE, WHE.SETTING_DEBUG);
  WHE.debug = debugEnabled;

  WHE.logMessage("settings reloaded");
});

/* ------------------------------------ */
// When ready
/* ------------------------------------ */
Hooks.once("ready", async function() {
  await game.audio.awaitFirstGesture();

  // Do anything once the module is ready
  const token = getActingToken({warn: false});

  if (!token) return;
  listenerToken = token;
  WHE.logMessage("Token obtained, id: ", listenerToken.id);

  // Muffling at startup
  doTheMuffling();
});

/* ------------------------------------ */
// When token is about to be moved
/* ------------------------------------ */
Hooks.on("updateToken", (_token, _updateData, _options, _userId) => {
  WHE.logMessage("updateToken called");

  if (listenerToken) {
    doTheMuffling();
  }
});

/* ------------------------------------ */
// When a Door is about to be opened
/* ------------------------------------ */
Hooks.on("updateWall", (_token, _updateData, _options, _userId) => {
  WHE.logMessage("updateWall called");

  if (listenerToken) {
    doTheMuffling();
  }
});

/* ------------------------------------ */
// When ambient sound is about to be moved
/* ------------------------------------ */
Hooks.on("updateAmbientSound", (_ambientSound, _updateData, _options, _userId) => {
  WHE.logMessage("updateAmbientSound called");

  if (listenerToken) {
    doTheMuffling();
  }
});

/* ------------------------------------ */
// When the user starts controlling a token
/* ------------------------------------ */
Hooks.on("controlToken", async (token, selected) => {
  WHE.logMessage("controlToken called");

  if (!selected) {
    WHE.logMessage("No token selected but getting from user");
    listenerToken = getActingToken({
      actor: game.user.character,
      warn: false
    });
  } else {
    WHE.logMessage("Token Selected so it should be yours");
    listenerToken = token;
  }
  if (listenerToken) {
    WHE.logMessage("Token obtained, id: ", listenerToken.id);
    WHE.logMessage("Got a Token, Doing the Muffling");
    await game.audio.awaitFirstGesture();
    doTheMuffling();
  } else {
    WHE.logMessage("Looks like you are the GM");
  }
});

/**
 * This will create filter nodes and assign to global variables for reuse.
 * This could be changes in the future as some sounds or sound listening
 * events may need different parameters depending on the occasion
 *
 * @param {AudioContext} context the audio conext
 * @param {number} muffling the muffling level required
 */
function getAudioMuffler(context, muffling) {
  const clamped = Math.floor(clamp(muffling, 0, 4));

  const MUFF_LEVELS = [5500, 670, 352, 200, 100]; // This is not linear

  if (clamped === 0) return null;

  WHE.logMessage("Now we have a context", context);
  const audioMuffler = context.createBiquadFilter(); // Walls have ears!

  audioMuffler.type = "lowpass";
  audioMuffler.frequency.value = MUFF_LEVELS[clamped]; // Awful = 100 / Heavy = 352 / Med = 979 / light = 5500
  audioMuffler.Q.value = 0; // 30 for a weird ass metallic sound, this should be 0

  WHE.logMessage("Filter initialized", audioMuffler);
  return audioMuffler;
}

/**
 * Loops through the sounds in the scene and estimate if its audible and the eventual
 * muffling index, after estimate that, applies the audio filter correspondingly
 */
function doTheMuffling() {

  if (wallsSoundsDisabled) return;
  if (!listenerToken) return;
  if (game.audio.locked) return;

  const tokenPosition = {
    x: listenerToken.center.x,
    y: listenerToken.center.y
  };

  const currentTokenId = listenerToken.id;

  /**
   * @type {AmbientSound[]}
   */
  const ambientSounds = game.canvas.sounds.placeables;
  WHE.logMessage("The sounds: ", ambientSounds);
  if (ambientSounds && ambientSounds.length > 0) {
    for (let i = 0; i < ambientSounds.length; i++) {
      const currentAmbientSound = ambientSounds[i];
      /**
       * @type {Sound}
       */
      const soundMediaSource = currentAmbientSound.sound;

      // Added in 0.8.x for Darkness range setting
      if (!currentAmbientSound.isAudible) {
        console.warn("WHE | Sound not Audible for (probably is just turned off)");
        continue;
      }
      if (!soundMediaSource.context) {
        console.warn("WHE | No Audio Context, waiting for user interaction");
        continue;
      }
      if (!currentAmbientSound.document.walls) {
        WHE.logMessage("Ignoring this sound, is not constrained by walls");
        clearSound(soundMediaSource.container.gainNode);
        continue;
      }

      const currentSoundId = currentAmbientSound.id;

      const currentSoundRadius = currentAmbientSound.document.radius;
      const soundPosition = {
        x: currentAmbientSound.center.x,
        y: currentAmbientSound.center.y
      };

      const distanceToSound = canvas.grid.measureDistance(tokenPosition, soundPosition);
      WHE.logMessage(`Sound ${i}`, soundMediaSource, currentSoundRadius, distanceToSound);

      if (currentSoundRadius < Math.floor(distanceToSound)) {
        continue;
      }

      const muffleIndex = getMufflingIndex(soundPosition, tokenPosition);
      if (muffleIndex < 0) {
        WHE.logMessage(`AmbientSound ${i}`, currentAmbientSound, soundMediaSource);
        continue;
      }

      const shouldBeMuffled = muffleIndex >= 1;

      let shouldMufflingChange = WHE.hasMufflingChanged(currentTokenId, currentSoundId, muffleIndex);

      // Caching muffling values to avoid changing filters if not needed
      if (shouldMufflingChange) {
        WHE.storeMufflingLevel(currentTokenId, currentSoundId, muffleIndex);

        WHE.logMessage("Token and Sound IDs: ", currentTokenId, currentSoundId);
        WHE.logMessage("Muffle index: ", muffleIndex);
        const audioMuffler = getAudioMuffler(soundMediaSource.context, muffleIndex);

        if (soundMediaSource.playing) {
          if (currentSoundRadius >= Math.floor(distanceToSound)) {
            // Muufle as needed
            if (shouldBeMuffled) {
              WHE.logMessage("Muffling");
              injectFilterIfPossible(soundMediaSource.container.gainNode, audioMuffler);
            } else {
              WHE.logMessage("Should not be muffled");
              clearSound(soundMediaSource.container.gainNode);
            }
          } else {
            WHE.logMessage("Sound is too far away!");
          }
        } else {
          // Schedule on start to take into consideration the moment
          // the user hasn't yet interacted with the browser so sound is unavailable
          WHE.logMessage("WIll muffle on start if needed");
          soundMediaSource.on("start", function(soundSource) {
            // Muffle as needed
            if (shouldBeMuffled) {
              injectFilterIfPossible(soundSource.container.gainNode, audioMuffler);
            } else {
              WHE.logMessage("Sound is starting but should not be muffled");
            }
          });
        }
      } else {
        WHE.logMessage("Cached muffling level WILL NOT change filter");
      }
    }
  }
}

/**
 * Inhecta a filterNode (probable any AudioNode) into the fron tof the node's path
 * connects the filter to the context destination, socurrently doesn't allos filter
 * stacking
 *
 * @param {AudioNode} sourceNode the audio node that contains the sound source
 * @param {AudioNode} filterNode the filter to be applied to the source
 */
function injectFilterIfPossible(sourceNode, filterNode) {
  if (sourceNode.numberOfOutputs !== 1) {
    return;
  }

  WHE.logMessage("Injecting Filter at volume", "current");
  sourceNode.disconnect(0);
  filterNode.disconnect(0);
  sourceNode.connect(filterNode);
  filterNode.connect(sourceNode.context.destination);
}

/**
 * Removes any node after the sourceNode so the sound can be heard clearly.
 * This could be done in a loop to clear an entire path
 *
 * @param {AudioNode} sourceNode the audio node that contains the sound source
 */
function clearSound(sourceNode) {
  if (sourceNode.destination === sourceNode.context.destination) {
    return;
  }
  sourceNode.disconnect(0);
  sourceNode.connect(sourceNode.context.destination);
}

/**
 * Ray casts the sound and the token and estimate a muffling index
 * @param {{x:number, y:number}} soundPoint The Token position
 * @param {{x:number, y:number}} tokenPoint The Sound position
 * @returns {number} returns the muffling index or -1 if the sound shouldn't be heard
 */
function getMufflingIndex(soundPoint, tokenPoint) {
  const ray = new Ray(tokenPoint, soundPoint);

  const sightLayer = CONFIG.Canvas.polygonBackends.sight;
  const soundLayer = CONFIG.Canvas.polygonBackends.sound;
  const moveLayer = CONFIG.Canvas.polygonBackends.move;

  // First, there should not be any sound interruption
  const hasSoundOccluded = soundLayer.testCollision(tokenPoint, soundPoint, {type: "sound", mode: "any"});

  if (hasSoundOccluded) {
    WHE.logMessage("This sound should not be heard (sound proof walls)");
    return -1;
  }

  // If you don't see it, it's muffled
  let sightCollisions = sightLayer.testCollision(tokenPoint, soundPoint, {type: "sight", mode: "all"});

  if (!sightCollisions) {
    WHE.logMessage("There are no walls!");
    return -1;
  }

  // New windows come by default with a distance triggering of the sight,
  // which we need to filter to keep (available) windows as 0 muffling
  sightCollisions = sightCollisions.filter(impactVertex => {
    const wall = impactVertex?.edges?.first()?.wall;
    const wallCenter = wall.center;

    const sightDistance = wall.document.threshold.sight;
    if (!sightDistance) {
      return true;
    }
    const tokenDistance = canvas.grid.measureDistance(tokenPoint, wallCenter);

    WHE.logMessage("Maximum sight:", sightDistance);
    WHE.logMessage("Distance to Wall:", tokenDistance);
    // If token is close to the window it should be open and not represent a sight collision
    return tokenDistance >= sightDistance;
  });


  console.log("Sight collisions", sightCollisions);

  // Then again if terrain collisions exist, you are in the same room
  const noTerrainSenseCollisions = sightCollisions.filter(impactVertex => {
    const wall = impactVertex?.edges?.first()?.isLimited;
    return !wall;
  });

  // This already takes into account open doors
  const moveCollisions = moveLayer.testCollision(tokenPoint, soundPoint, {type: "move", mode: "all"});

  // Present the results
  WHE.logMessage("Collision walls (MOVE):", moveCollisions.length);
  WHE.logMessage("Collision walls (SIGHT):", sightCollisions.length);
  WHE.logMessage("Collision walls (SIGHT excl. terrain ):", noTerrainSenseCollisions.length);

  // Estimating how much to muffle
  // See image:
  const finalMuffling = Math.floor((noTerrainSenseCollisions.length + moveCollisions.length) / 2);

  // Account for ethereal walls
  if (sightCollisions.length >= 1 && moveCollisions.length === 0) {
    WHE.logMessage("There is at least an ethereal wall");
    return 0;
  }

  return finalMuffling || 0;
}

/**
 * This is a "Way too complex" function to get acting token or user-owned token
 *
 * @param {*} options
 * @returns {object|null} the token object or null
 */
function getActingToken({
  actor,
  limitActorTokensToControlledIfHaveSome = true,
  warn = true,
  linked = false
} = {}) {
  const tokens = [];
  const character = game.user.character;
  if (actor) {
    if (limitActorTokensToControlledIfHaveSome && canvas.tokens.controlled.length > 0) {
      tokens.push(
        ...canvas.tokens.controlled.filter(t => {
          if (!(t instanceof Token)) return false;
          if (linked) return t.data.actorLink && t.data.actorId === this._id;
          return t.data.actorId === this._id;
        })
      );
      tokens.push(
        ...actor
          .getActiveTokens()
          .filter(t => canvas.tokens.controlled.some(tc => tc._id === t._id))
      );
    } else {
      tokens.push(...actor.getActiveTokens());
    }
  } else {
    tokens.push(...canvas.tokens.controlled);
    if (tokens.length === 0 && character) {
      tokens.push(...character.getActiveTokens());
    }
  }
  if (tokens.length > 1) {
    if (warn) ui.notifications.error("Too many tokens selected or too many tokens of actor in current scene.");
    return null;
  } else {
    return tokens[0] ? tokens[0] : null;
  }
}
