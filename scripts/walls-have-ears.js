import WHE from './WHE.js';

let wallsSoundsDisabled = true;
let listenerToken = null;
let LATEST_FILTER = null;

/* ------------------------------------ */
// Initialize module
/* ------------------------------------ */
Hooks.once('init', async function () {
    console.log('walls-have-ears | Initializing foundry-ping-times');

    wallsSoundsDisabled = game.settings.get(WHE.MODULE, WHE.SETTING_DISABLE);

    // Register custom sheets (if any)
    console.log('walls-have-ears | init finished');
});

/* ------------------------------------ */
// Setup module
/* ------------------------------------ */
Hooks.once('setup', function () {
    console.log('walls-have-ears | module setup started');
    // Do anything after initialization but before

    // ready
    console.log('walls-have-ears | module setup finished');
});

/* ------------------------------------ */
// When ready
/* ------------------------------------ */
Hooks.once('ready', async function () {
    // Do anything once the module is ready
    const token = getActingToken();

    await game.audio.awaitFirstGesture();

    //Creating the filter
    getAudioMuffler(game.audio.getAudioContext());

    if (!token) return;
    listenerToken = token;
    console.log('walls-have-ears | Token obtained', listenerToken);

});

// Add any additional hooks if necessary
// eslint-disable-next-line no-unused-vars
Hooks.on('preUpdateToken', (token, updateData, options, userId) => {
    console.log('walls-have-ears | preUpdateToken called');
    if (updateData) {
        console.log('walls-have-ears | Something changed', token, updateData, options);
    } else {
        console.warn('walls-have-ears | preUpdateToken NODIF', listenerToken);
    }
    if (listenerToken) {
        doTheMuffling();
    }
});

Hooks.on('preUpdateAmbientSound', (ambientSound, updateData, options, userId) => {
    console.log('walls-have-ears | preUpdateAmbientSound called');
    if (updateData) {
        console.log('walls-have-ears | Something changed', ambientSound, updateData, options);
    } else {
        console.warn('walls-have-ears | preUpdateToken NODIF', listenerToken);
    }
    if (listenerToken) {
        doTheMuffling();
    }
});

// If its a gamemaster, lets get the controlled token
Hooks.on('controlToken', (token, selected) => {
    if (!selected) {
        console.log('walls-have-ears | No token selected but getting from user');
        listenerToken = getActingToken({ actor: game.user.character });
    } else {
        console.log('walls-have-ears | Token Selected so it should be yours');
        listenerToken = token;
    }
    if (!listenerToken) {
        console.log('walls-have-ears | Looks like you are the GM');
    } else {
        doTheMuffling();
    }

});

/**
 * This will create filter nodes and assign to global variables for reuse.
 * This could be changes in the future as some sounds or sound listening
 * events may need different parameters depending the occasion
 *
 * @param context : AudioContext
 */
function getAudioMuffler(context) {
    console.log('walls-have-ears | Now we have a context', context);
    const audioMuffler = context.createBiquadFilter(); // Walls have ears!

    audioMuffler.type = 'lowpass';
    audioMuffler.frequency.value = 352; // Awful = 100 / Heavy = 352 / Med = 979 / light = 5500
    audioMuffler.Q.value = 0; // 30 for a weird ass metallic sound, this should be 0

    console.log('walls-have-ears | Filter initialized', audioMuffler);
    return audioMuffler;
}

function doTheMuffling() {
    if (wallsSoundsDisabled) return;
    if (!listenerToken) return;

    const tokenPosition = {
        x: listenerToken.x,
        y: listenerToken.y,
    };
    console.log('walls-have-ears | Token is at: ', tokenPosition);
    /**
     * @type {AmbientSound[]}
     */
    const ambientSounds = canvas.sounds.placeables;
    if (ambientSounds && ambientSounds.length > 0) {
        for (var i = 0; i < ambientSounds.length; i++) {
            const currentAmbientSound = ambientSounds[i];
            /**
             * @type {Sound}
             */
            const soundMediaSource = currentAmbientSound.sound;

            //Added in 0.8.x for Darkness range setting
            if (!currentAmbientSound.isAudible) {
                console.warn('walls-have-ears | Not Audible for some reason');
                continue;
            }
            if (!soundMediaSource.context) {
                console.warn('walls-have-ears | No Audio Context, waiting for user interaction');
                continue;
            }
            if (currentAmbientSound.type !== 'l') {
                console.warn('walls-have-ears | Ignoring global ambients sounds (for now)');
                continue;
            }

            const currentSoundRadius = currentAmbientSound.data.radius;
            const soundPosition = {
                x: currentAmbientSound.center.x,
                y: currentAmbientSound.center.y,
            };

            const distanceToSound = canvas.grid.measureDistance(tokenPosition, soundPosition);

            const audioMuffler = getAudioMuffler(soundMediaSource.context);
            console.log('walls-have-ears | Sound ' + i, soundMediaSource, currentSoundRadius, distanceToSound);

            if (soundMediaSource.playing) {
                if (currentSoundRadius >= Math.floor(distanceToSound)) {

                    console.log('walls-have-ears | RESUME', soundMediaSource.volume, soundMediaSource.container.gainNode.gain.value);
                    const volume = soundMediaSource.volum;
                    if (howManyWallsBetween(soundPosition, tokenPosition) >= 2) {
                        injectFilterIfPossible(soundMediaSource.container.gainNode, audioMuffler, null);
                    } else {
                        clearSound(soundMediaSource.container.gainNode);
                    }
                } else {
                    console.log('walls-have-ears | Im FAR AWAY! and IS PLAYING', soundMediaSource.container.gainNode);
                }
            } else {
                if (currentSoundRadius >= Math.floor(distanceToSound)) {
                    soundMediaSource.on('start', function (soundSource) {
                        if (howManyWallsBetween(soundPosition, tokenPosition) >= 2) {
                            injectFilterIfPossible(soundSource.container.gainNode, audioMuffler, null);
                        } else {
                            clearSound(soundSource.container.gainNode);
                        }
                    });
                } else {
                    console.log('walls-have-ears | Im FAR AWAY!', soundMediaSource.container.gainNode);
                }
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
 * @param volume: float
 */
function injectFilterIfPossible(sourceNode, filterNode, volume) {

    if (sourceNode.numberOfOutputs !== 1) {
        return;
    }
    let targetNode = null;
    if (volume !== null && isFinite(volume)) {
        console.log('walls-have-ears | Injecting Filter at volume', volume);
        targetNode = sourceNode.context.createGain();
        targetNode.gain.value = parseFloat(volume);
        targetNode.connect(sourceNode.context.destination);
    } else {
        console.log('walls-have-ears | Injecting Filter at volume', 'current');
        targetNode = sourceNode.context.destination;
    }

    sourceNode.disconnect(0);
    filterNode.disconnect(0);
    sourceNode.connect(filterNode);
    filterNode.connect(targetNode);
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
    const filterNode = sourceNode.destination;
    //filterNode.disconnect(0);
    sourceNode.disconnect(0);
    sourceNode.connect(sourceNode.context.destination);
}

// Get if ywo points have a wall
function howManyWallsBetween({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const ray = new Ray({ x: x1, y: y1 }, { x: x2, y: y2 });
    const collisions = canvas.walls.getRayCollisions(ray, {
        type: 'movement',
        mode: 'all'
    });

    let res = (collisions && collisions.length !== undefined) ? collisions.length : 0;
    if (res > 0) {
        // Avoid mufflin through open doors
        for (var i = 0; i < collisions.length; i++) {
            const wall = collisions[i];
            console.log('walls-have-ears | Checking collisions on this wall', wall);
            //If it's a door
            if (wall.door !== 0) {
                //If it is open
                if (wall.ds === 1) {
                    res--;
                }
            }
        }
    }

    return res;
}

//“Too complex to use” way to get active token:
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
            tokens.push(...canvas.tokens.controlled.filter(t => {
                if (!(t instanceof Token)) return false;
                if (linked) return t.data.actorLink && t.data.actorId === this._id;
                return t.data.actorId === this._id;
            }));
            tokens.push(...actor.getActiveTokens().filter(t => canvas.tokens.controlled.some(tc => tc._id === t._id)));
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
        if (warn) ui.notifications.error('Too many tokens selected or too many tokens of actor in current scene.');
        return null;
    } else {
        return tokens[0] ? tokens[0] : null;
    }
}
