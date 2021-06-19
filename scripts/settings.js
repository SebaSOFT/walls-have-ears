import WHE from './WHE.js';

/* ------------------------------------ */
// Initialize module settings
/* ------------------------------------ */
Hooks.once('init', async function () {

    game.settings.register(WHE.MODULE, WHE.SETTING_DISABLE, {
        name: WHE.getMessageText(WHE.STR_SETTING_DISABLE_TITLE),
        hint: WHE.getMessageText(WHE.STR_SETTING_DISABLE_HINT),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false
    });

});
