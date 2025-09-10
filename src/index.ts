import WHEUtils from './utils/WHEUtils';
import { WHEConstants } from './utils/WHEConstants';
import WHESettings from './settings/WHESettings';
import WHEFramework from './framework/WHEFramework';
import { getGame } from './foundry/getGame';

const forceDebug = false;

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
  await getGame().audio.awaitFirstGesture();

  // Override all ambient sounds muffled effects
  const ambientSounds = getGame()!.canvas!.sounds!.placeables;

  ambientSounds.forEach((sound: foundry.canvas.placeables.AmbientSound) => {
    sound.document.effects.muffled.type = 'lowpass';
    sound.document.effects.muffled.intensity = 0;
    sound.document.update({
      effects: {
        muffled: { type: 'lowpass', intensity: 0 },
      },
    });
    sound.initializeSoundSource();
  });

  // libWrapper warning
  if (!game!.modules!.get('lib-wrapper')?.active && game!.user!.isGM) {
    ui!.notifications!.warn("Module XYZ requires the 'libWrapper' module. Please install and activate it.");
  }

  WHEUtils.log('WHE is now ready.');
});
