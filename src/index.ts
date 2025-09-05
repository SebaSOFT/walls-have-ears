import WHEUtils from './utils/WHEUtils';
import { WHEConstants } from './utils/WHEConstants';
import WHESettings from './settings/WHESettings';
import WHEFramework from './framework/WHEFramework';

const forceDebug = true;

Hooks.once('init', async () => {
  WHEUtils.debug = forceDebug;
  WHESettings.getInstance().initialize();

  WHEUtils.log('WHE is being initialized.');
});

// Load setup from the server
Hooks.once('setup', () => {
  WHEUtils.debug = forceDebug ? true : WHESettings.getInstance().getBoolean(WHEConstants.SETTING_DEBUG, false);

  //Framework setup
  WHEFramework.getInstance().initialize();

  WHEUtils.log('WHE is being setup.');
});

// The user has changed the setuyp
Hooks.on('closeSettings', () => {
  WHEUtils.debug = forceDebug ? true : WHESettings.getInstance().getBoolean(WHEConstants.SETTING_DEBUG, false);

  WHEUtils.log('Client has closed Setup window.');
});

Hooks.once('ready', async () => {
  await game.audio?.awaitFirstGesture();

  WHEUtils.log('WHE is now ready.');
});
