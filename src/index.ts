import WHEUtils from './utils/WHEUtils';
import { WHEConstants } from './utils/WHEConstants';
import WHESettings from './game/WHESettings';

const forceDebug = false;

Hooks.once('init', async () => {
  WHEUtils.debug = forceDebug;
  WHESettings.getInstance().initialize();

  WHEUtils.log('WHE is being initialized.');
});

Hooks.once('setup', () => {
  WHEUtils.debug = forceDebug ? true : WHESettings.getInstance().getBoolean(WHEConstants.SETTING_DEBUG, false);

  WHEUtils.log('WHE is being setup.');
});

Hooks.once('ready', () => {
  WHEUtils.log('WHE is now ready.');
});
