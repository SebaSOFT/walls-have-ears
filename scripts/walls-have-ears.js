/* eslint-disable no-unused-vars */
import WHE from './WHE.js';

let wallsSoundsDisabled = true;
let listenerToken = null;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/* ------------------------------------ */
// Initialize module
/* ------------------------------------ */
Hooks.once('init', async function () {
    // console.log('walls-have-ears | Initializing foundry-ping-times');

    // Get User Options
    wallsSoundsDisabled = game.settings.get(WHE.MODULE, WHE.SETTING_DISABLE);

    // Register custom sheets (if any)
    // console.log('walls-have-ears | init finished');
});

/* ------------------------------------ */
// Setup module
/* ------------------------------------ */
Hooks.once('setup', function () {
    // console.log('walls-have-ears | module setup started');
    // Do anything after initialization but before
    // ready
    // console.log('walls-have-ears | module setup finished');
});

/* ------------------------------------ */
// When ready
/* ------------------------------------ */
Hooks.once('ready', async function () {
    await game.audio.awaitFirstGesture();

    // Do anything once the module is ready
    const token = getActingToken({ warn: false });

    if (!token) return;
    listenerToken = token;

    // Muffling at startup
    doTheMuffling();
    // console.log('walls-have-ears | Token obtained', listenerToken);
});

/* ------------------------------------ */
// When token is about to be moved
/* ------------------------------------ */
Hooks.on('updateToken', (_token, _updateData, _options, _userId) => {
    // console.log('walls-have-ears | updateToken called');
    //if (token != listenerToken) return;
    if (listenerToken) {
        doTheMuffling();
    }
});

/* ------------------------------------ */
// When a Door is about to be opened
/* ------------------------------------ */
Hooks.on('updateWall', (_token, _updateData, _options, _userId) => {
    // console.log('walls-have-ears | updateWall called');
    //if (token != listenerToken) return;
    if (listenerToken) {
        doTheMuffling();
    }
});

/* ------------------------------------ */
// When ambient sound is about to be moved
/* ------------------------------------ */
Hooks.on('updateAmbientSound', (_ambientSound, _updateData, _options, _userId) => {
    // console.log('walls-have-ears | updateAmbientSound called');
    if (listenerToken) {
        doTheMuffling();
    }
});

// If its a gamemaster, lets get the controlled token
Hooks.on('controlToken', (token, selected) => {
    if (!selected) {
        // console.log('walls-have-ears | No token selected but getting from user');
        listenerToken = getActingToken({
            actor: game.user.character,
            warn: false,
        });
    } else {
        // console.log('walls-have-ears | Token Selected so it should be yours');
        listenerToken = token;
    }
    if (listenerToken) {
        doTheMuffling();
    } else {
        // console.log('walls-have-ears | Looks like you are the GM');
    }
});

/**
 * This will create filter nodes and assign to global variables for reuse.
 * This could be changes in the future as some sounds or sound listening
 * events may need different parameters depending the occasion
 *
 * @param context : AudioContext
 * @param muffling : int
 */
function getAudioMuffler(context, muffling) {
    const clamped = Math.floor(clamp(muffling, 0, 4));

    const MUFF_LEVELS = [5500, 670, 352, 200, 100]; // This is not linear

    if (clamped == 0) return null;

    // console.log('walls-have-ears | Now we have a context', context);
    const audioMuffler = context.createBiquadFilter(); // Walls have ears!

    audioMuffler.type = 'lowpass';
    audioMuffler.frequency.value = MUFF_LEVELS[clamped]; // Awful = 100 / Heavy = 352 / Med = 979 / light = 5500
    audioMuffler.Q.value = 0; // 30 for a weird ass metallic sound, this should be 0

    // console.log('walls-have-ears | Filter initialized', audioMuffler);
    return audioMuffler;
}

function doTheMuffling() {
    if (wallsSoundsDisabled) return;
    if (!listenerToken) return;
    if (game.audio.locked) return;

    const tokenPosition = {
        x: listenerToken.center.x,
        y: listenerToken.center.y,
    };

    /**
     * @type {AmbientSound[]}
     */
    const ambientSounds = game.canvas.sounds.placeables;

    if (ambientSounds && ambientSounds.length > 0) {
        for (var i = 0; i < ambientSounds.length; i++) {
            const currentAmbientSound = ambientSounds[i];
            /**
             * @type {Sound}
             */
            const soundMediaSource = currentAmbientSound.sound;

            //Added in 0.8.x for Darkness range setting
            if (!currentAmbientSound.isAudible) {
                // console.warn('walls-have-ears | Sound not Audible for some reason');
                continue;
            }
            if (!soundMediaSource.context) {
                // console.warn('walls-have-ears | No Audio Context, waiting for user interaction');
                continue;
            }
            if (currentAmbientSound.type !== 'l') {
                // console.warn('walls-have-ears | Ignoring global ambients sounds (for now)');
                continue;
            }

            const currentSoundRadius = currentAmbientSound.data.radius;
            const soundPosition = {
                x: currentAmbientSound.center.x,
                y: currentAmbientSound.center.y,
            };

            const distanceToSound = canvas.grid.measureDistance(tokenPosition, soundPosition);
            // console.log('walls-have-ears | Sound ' + i, soundMediaSource, currentSoundRadius, distanceToSound);

            if (currentSoundRadius < Math.floor(distanceToSound)) {
                continue;
            }

            const muffleIndex = getMufflingIndex(soundPosition, tokenPosition);
            if (muffleIndex < 0) {
                // clearSound(soundMediaSource.container.gainNode);
                // console.log('walls-have-ears | Sound ' + i, currentAmbientSound, soundMediaSource);
                continue;
            }

            const shouldBeMuffled = muffleIndex >= 1;
            // console.log('walls-have-ears | muffle index: ', muffleIndex);
            const audioMuffler = getAudioMuffler(soundMediaSource.context, muffleIndex);

            if (soundMediaSource.playing) {
                if (currentSoundRadius >= Math.floor(distanceToSound)) {
                    // Muufle as needed
                    if (shouldBeMuffled) {
                        // console.log('walls-have-ears | Muffling');
                        injectFilterIfPossible(soundMediaSource.container.gainNode, audioMuffler);
                    } else {
                        // console.log('walls-have-ears | Should not be muffled');
                        clearSound(soundMediaSource.container.gainNode);
                    }
                } else {
                    console.log('walls-have-ears | Im FAR AWAY! and IS PLAYING');
                    // clearSound(soundMediaSource.container.gainNode);
                    continue;
                }
            } else {
                // Schedule on start to take into consideration the moment
                // the user hasn-t yet interacted with the browser so sound is unavailable
                // console.log('walls-have-ears | WIll muffle on start');
                soundMediaSource.on('start', function (soundSource) {
                    // Muffle as needed
                    if (shouldBeMuffled) {
                        injectFilterIfPossible(soundSource.container.gainNode, audioMuffler);
                    } else {
                        console.log('walls-have-ears | ON START Should not be muffled');
                        // clearSound(soundSource.container.gainNode);
                    }
                });
            }
        }
    }
}

/**
 * inhecta a filterNode (probable any AudioNode) into the fron tof the node's path
 * connects the filter to the context destination, socurrently doesnt allos filter
 * stacking
 *
 * @param sourceNode: AudioNode
 * @param filterNode: AudioNode
 */
function injectFilterIfPossible(sourceNode, filterNode) {
    if (sourceNode.numberOfOutputs !== 1) {
        return;
    }

    // console.log('walls-have-ears | Injecting Filter at volume', 'current');
    sourceNode.disconnect(0);
    filterNode.disconnect(0);
    sourceNode.connect(filterNode);
    filterNode.connect(sourceNode.context.destination);
}

/**
 * Removes any node after the sourceNode so the sound can be heard clearly.
 * This could be done in a loop to clear an entire path
 *
 * @param sourceNode: AudioNode
 */
function clearSound(sourceNode) {
    if (sourceNode.destination === sourceNode.context.destination) {
        return;
    }
    sourceNode.disconnect(0);
    sourceNode.connect(sourceNode.context.destination);
}

// Get if ywo points have a wall
function getMufflingIndex({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const ray = new Ray({ x: x1, y: y1 }, { x: x2, y: y2 });

    const hasSoundOccluded = canvas.walls.getRayCollisions(ray, {
        type: 'sound',
        mode: 'any',
    });
    if (hasSoundOccluded) {
        return -1;
    }

    // If you dont see it, it's muffled
    const sensesCollision = canvas.walls.getRayCollisions(ray, {
        type: 'sight',
        mode: 'all',
    });

    // Then again if terrain collissions exist, you are in the same room
    const noTerrainSightCollisions = sensesCollision.filter((item) => item.type != 2);

    //This already takes into account open doors
    const moveCollisions = canvas.walls.getRayCollisions(ray, {
        type: 'movement',
        mode: 'all',
    });

    // Estimating how much to muffle
    // See image:
    const finalMuffling = Math.floor((noTerrainSightCollisions.length + moveCollisions.length) / 2);

    // Account for ethereal walls
    if (sensesCollision.length >= 1 && moveCollisions.length == 0) {
        return 0;
    }

    return finalMuffling || 0;
}

/**
 * This is a "Way too complex" function to get acting token or user-owned token
 *
 * @param {*} options
 * @returns
 */
function getActingToken({
    actor,
    limitActorTokensToControlledIfHaveSome = true,
    warn = true,
    linked = false,
} = {}) {
    const tokens = [];
    const character = game.user.character;
    if (actor) {
        if (limitActorTokensToControlledIfHaveSome && canvas.tokens.controlled.length > 0) {
            tokens.push(
                ...canvas.tokens.controlled.filter((t) => {
                    if (!(t instanceof Token)) return false;
                    if (linked) return t.data.actorLink && t.data.actorId === this._id;
                    return t.data.actorId === this._id;
                })
            );
            tokens.push(
                ...actor
                    .getActiveTokens()
                    .filter((t) => canvas.tokens.controlled.some((tc) => tc._id === t._id))
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
        if (warn)
            ui.notifications.error('Too many tokens selected or too many tokens of actor in current scene.');
        return null;
    } else {
        return tokens[0] ? tokens[0] : null;
    }
}
