/* eslint-disable no-unused-vars */
import WHE from './WHE.js';

window.WHE = window.WHE || WHE;

let wallsSoundsDisabled = true;
let listenerToken = null;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/* ------------------------------------ */
// Initialize module
/* ------------------------------------ */
Hooks.once('init', async function () {
    WHE.logMessage('Initializing walls have ears');

    // Register custom sheets (if any)

    WHE.logMessage('init finished');
});

/* ------------------------------------ */
// Setup module
/* ------------------------------------ */
Hooks.once('setup', function () {
    WHE.logMessage('module setup started');

    // Do anything after initialization but before ready

    // Get User Options
    wallsSoundsDisabled = game.settings.get(WHE.MODULE, WHE.SETTING_DISABLE);

    WHE.logMessage('module setup finished');
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
    WHE.logMessage('Token obtained', listenerToken);
});

/* ------------------------------------ */
// When token is about to be moved
/* ------------------------------------ */
Hooks.on('updateToken', (_token, _updateData, _options, _userId) => {
    WHE.logMessage('updateToken called');

    if (listenerToken) {
        doTheMuffling();
    }
});

/* ------------------------------------ */
// When a Door is about to be opened
/* ------------------------------------ */
Hooks.on('updateWall', (_token, _updateData, _options, _userId) => {
    WHE.logMessage('updateWall called');

    if (listenerToken) {
        doTheMuffling();
    }
});

/* ------------------------------------ */
// When ambient sound is about to be moved
/* ------------------------------------ */
Hooks.on('updateAmbientSound', (_ambientSound, _updateData, _options, _userId) => {
    WHE.logMessage('updateAmbientSound called');
    if (listenerToken) {
        doTheMuffling();
    }
});

// If its a gamemaster, lets get the controlled token
Hooks.on('controlToken', async (token, selected) => {
    if (!selected) {
        WHE.logMessage('No token selected but getting from user');
        listenerToken = getActingToken({
            actor: game.user.character,
            warn: false,
        });
    } else {
        WHE.logMessage('Token Selected so it should be yours');
        listenerToken = token;
    }
    if (listenerToken) {
        WHE.logMessage('Got a Token, Doing the Muffling');
        await game.audio.awaitFirstGesture();
        doTheMuffling();
    } else {
        WHE.logMessage('Looks like you are the GM');
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

    if (clamped === 0) return null;

    WHE.logMessage('Now we have a context', context);
    const audioMuffler = context.createBiquadFilter(); // Walls have ears!

    audioMuffler.type = 'lowpass';
    audioMuffler.frequency.value = MUFF_LEVELS[clamped]; // Awful = 100 / Heavy = 352 / Med = 979 / light = 5500
    audioMuffler.Q.value = 0; // 30 for a weird ass metallic sound, this should be 0

    WHE.logMessage('Filter initialized', audioMuffler);
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
    WHE.logMessage('The SOUNDS: ', ambientSounds);
    if (ambientSounds && ambientSounds.length > 0) {
        for (let i = 0; i < ambientSounds.length; i++) {
            const currentAmbientSound = ambientSounds[i];
            /**
             * @type {Sound}
             */
            const soundMediaSource = currentAmbientSound.sound;

            //Added in 0.8.x for Darkness range setting
            if (!currentAmbientSound.isAudible) {
                console.warn('WHE | Sound not Audible for some reason');
                continue;
            }
            if (!soundMediaSource.context) {
                console.warn('WHE | No Audio Context, waiting for user interaction');
                continue;
            }

            const currentSoundRadius = currentAmbientSound.data.radius;
            const soundPosition = {
                x: currentAmbientSound.center.x,
                y: currentAmbientSound.center.y,
            };

            const distanceToSound = canvas.grid.measureDistance(tokenPosition, soundPosition);
            WHE.logMessage('WHE | Sound ' + i, soundMediaSource, currentSoundRadius, distanceToSound);

            if (currentSoundRadius < Math.floor(distanceToSound)) {
                continue;
            }

            const muffleIndex = getMufflingIndex(soundPosition, tokenPosition);
            if (muffleIndex < 0) {
                // clearSound(soundMediaSource.container.gainNode);
                WHE.logMessage('Sound ' + i, currentAmbientSound, soundMediaSource);
                continue;
            }

            const shouldBeMuffled = muffleIndex >= 1;
            WHE.logMessage('Muffle index: ', muffleIndex);
            const audioMuffler = getAudioMuffler(soundMediaSource.context, muffleIndex);

            if (soundMediaSource.playing) {
                if (currentSoundRadius >= Math.floor(distanceToSound)) {
                    // Muufle as needed
                    if (shouldBeMuffled) {
                        WHE.logMessage('Muffling');
                        injectFilterIfPossible(soundMediaSource.container.gainNode, audioMuffler);
                    } else {
                        WHE.logMessage('Should not be muffled');
                        clearSound(soundMediaSource.container.gainNode);
                    }
                } else {
                    WHE.logMessage('Im FAR AWAY! and IS PLAYING');
                    // clearSound(soundMediaSource.container.gainNode);
                    // continue;
                }
            } else {
                // Schedule on start to take into consideration the moment
                // the user hasn-t yet interacted with the browser so sound is unavailable
                WHE.logMessage('WIll muffle on start');
                soundMediaSource.on('start', function (soundSource) {
                    // Muffle as needed
                    if (shouldBeMuffled) {
                        injectFilterIfPossible(soundSource.container.gainNode, audioMuffler);
                    } else {
                        WHE.logMessage('ON START Should not be muffled');
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

    WHE.logMessage('Injecting Filter at volume', 'current');
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

    const hasSoundOccluded = canvas.walls.checkCollision(ray, {
        type: 'sound',
        mode: 'any',
    });
    if (hasSoundOccluded) {
        WHE.logMessage('NO ABLE TO HEAR');
        return -1;
    }

    // If you dont see it, it's muffled
    const sensesCollision = canvas.walls.checkCollision(ray, {
        type: 'sight',
        mode: 'all',
    });

    // Then again if terrain collissions exist, you are in the same room
    const noTerrainSightCollisions = sensesCollision.filter((impactVertex) => {
        const wall = impactVertex?.edges?.first()?.isLimited;
        return !wall;
    });

    //This already takes into account open doors
    const moveCollisions = canvas.walls.checkCollision(ray, {
        type: 'move',
        mode: 'all',
    });

    // Estimating how much to muffle
    // See image:
    const finalMuffling = Math.floor((noTerrainSightCollisions.length + moveCollisions.length) / 2);

    WHE.logMessage('MOVE SENSE Coll', moveCollisions, sensesCollision);
    // Account for ethereal walls
    if (sensesCollision.length >= 1 && moveCollisions.length === 0) {
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
