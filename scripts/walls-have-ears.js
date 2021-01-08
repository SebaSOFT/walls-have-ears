import WHE from './WHE.js';

let wallsSoundsDisabled = true;
let listenerToken = null;
let audioMuffler = null;
let audioOutput = null;

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
Hooks.once('ready', function () {
    // Do anything once the module is ready
    const token = getActingToken();

    //Creating the filter
    audioMuffler = Howler.ctx.createBiquadFilter();
    audioMuffler.type = 'lowpass';
    audioMuffler.frequency.value = 200; // Awful = 100 / Heavy = 352 / Med = 979 / light = 5500
    audioMuffler.Q.value = 1; // 30 for a weird as metalic sound, this should be 0
    audioOutput = Howler.ctx.destination;

    console.log('walls-have-ears | Filter initialized', audioMuffler);

    if (!token) return;
    listenerToken = token;
    console.log('walls-have-ears | Token obtained', listenerToken);

});

// Add any additional hooks if necessary
// eslint-disable-next-line no-unused-vars
Hooks.on('preUpdateToken', (scene, token, updateData, { diff }, userId) => {
    console.log('walls-have-ears | preUpdateToken called');
    if (!diff) console.warn('walls-have-ears | preUpdateToken NODIF');

    doTheMuffling();
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
        console.log('walls-have-ears | You should be Gamemaster or DM');
    }
    doTheMuffling();
});

function doTheMuffling() {
    if (wallsSoundsDisabled) return;
    if (!listenerToken) return;

    const tokenPos = {
        x: listenerToken.x,
        y: listenerToken.y,
    };

    const ambiSounds = canvas.sounds.placeables;
    if (ambiSounds && ambiSounds.length > 0) {
        for (var i = 0; i < ambiSounds.length; i++) {
            const snd = ambiSounds[i];
            const sndMaxDist = snd.data.radius;
            const sndPos = {
                x: snd.data.x,
                y: snd.data.y,
            };
            const sndHowl = snd.howl;
            const sndDist = canvas.grid.measureDistance(tokenPos, sndPos);

            // console.log('walls-have-ears | Sound ' + i, sndPos, sndMaxDist, sndDist);

            if (sndMaxDist >= sndDist) {
                let sndSource = null;
                if (!sndHowl.playing()) {
                    sndHowl.play();
                    sndSource = sndHowl._sounds[0]._node.bufferSource;
                    console.log('walls-have-ears | Sound Needs to SOUND MUFFLED!', sndHowl);
                    sndSource.disconnect(0);
                    audioMuffler.disconnect(0);
                    sndSource.connect(audioMuffler);
                    audioMuffler.connect(audioOutput);
                    sndHowl.play();
                } else {
                    sndSource = sndHowl._sounds[0]._node.bufferSource;
                    console.log('walls-have-ears | Sound Is playing, you be played normally', sndHowl.playing());
                    sndSource.disconnect(0);
                    audioMuffler.disconnect(0);
                    sndSource.connect(audioOutput);
                }
            } else {
                if (sndHowl.playing()) {
                    console.log('walls-have-ears | Stopping sound, weird!');
                    sndHowl.stop();
                }
            }
        }
    }
}

// Get if ywo points have a wall
function howManyWallsBetween({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const ray = new Ray({ x: x1, y: y1 }, { x: x2, y: y2 });
    const collisions = WallsLayer.getWallCollisionsForRay(ray, canvas.walls.blockVision);

    let res = (collisions && collisions.length !== undefined) ? collisions.length : 0;
    if (res > 0) {
        // Avoid mufflin through open doors
        for (var i = 0; i < collisions.length; i++) {
            const wall = collisions[i];
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
function getActingToken({ actor, limitActorTokensToControlledIfHaveSome = true, warn = true, linked = false } = {}) {
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
