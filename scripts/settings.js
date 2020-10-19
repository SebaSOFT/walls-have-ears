import WHE from './WHE.js';

/* ------------------------------------ */
// Initialize module settings
/* ------------------------------------ */
Hooks.once('init', async function() {

    game.settings.register(WHE.MODULE, WHE.SETTING_DISABLE, {
        name: WHE.getMessageText('WHE.settings_disable.title'),
        hint: WHE.getMessageText('WHE.settings_disable.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false
    });

});
