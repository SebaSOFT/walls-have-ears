import WHE from "./WHE.js";

/* ------------------------------------ */
// Initialize module settings
/* ------------------------------------ */
Hooks.once("init", async function() {

  game.settings.register(WHE.MODULE, WHE.SETTING_DISABLE, {
    name: WHE.getMessageText(WHE.STR_SETTING_DISABLE_TITLE),
    hint: WHE.getMessageText(WHE.STR_SETTING_DISABLE_HINT),
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(WHE.MODULE, WHE.SETTING_DEBUG, {
    name: WHE.getMessageText(WHE.STR_SETTING_DEBUG_TITLE),
    hint: WHE.getMessageText(WHE.STR_SETTING_DEBUG_HINT),
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });


  // Register custom sheets (if any)
  // console.log('walls-have-ears | settings registration finished');
});
