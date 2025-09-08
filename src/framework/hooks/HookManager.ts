import WHEUtils from '../../utils/WHEUtils';
import { WHEConstants } from '../../utils/WHEConstants';
import { getGame } from '../../foundry/getGame';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { libWrapper } from '../../lib/libWrapper';
import WHEFramework from '../WHEFramework';
import SoundManager from '../audio/SoundManager';

/**
 * Manages all FoundryVTT hooks and libWrapper patches for the module.
 */
export default class HookManager {
  private readonly _wheFramework: WHEFramework;

  /**
   * @param {WHEFramework} wheFramework - The main framework instance.
   */
  constructor(wheFramework: WHEFramework) {
    this._wheFramework = wheFramework;
  }

  /**
   * Registers all necessary hooks and libWrapper patches.
   */
  public registerHooks(): void {
    WHEUtils.log('HookManager registerHooks...');
    // ---------- H O O K S ---------- //
    // Hook wen the scene is ready
    Hooks.on('ready', async () => {
      await getGame().audio.awaitFirstGesture();

      this._wheFramework.performMuffling();

      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // IMPORTANT: Do not convert to an arrow function.
      // The `this` context must be the `Wall` instance for libWrapper to work correctly.
      libWrapper.register(
        WHEConstants.MODULE,
        'foundry.canvas.placeables.Wall.prototype._playDoorSound',
        function (wrapped: (interaction: string) => void, args: any) {
          // @ts-expect-error
          const wall = this as foundry.canvas.placeables.Wall;
          SoundManager.getInstance().playDoorSound(wrapped, args, wall);
        },
        'MIXED',
      );
    });
    // When a token is about to be moved
    Hooks.on('updateToken', (_token, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateToken');
      this._wheFramework.performMuffling();
    });
    // When a Door is about to be opened
    Hooks.on('updateWall', (_token, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateWall');
      this._wheFramework.performMuffling();
    });
    // When the user starts controlling a token
    Hooks.on('controlToken', async (token, selected) => {
      await this._wheFramework.getPlayerContext().checkForChangedSelection(token, selected);
      this._wheFramework.performMuffling();
    });
    // When ambient sound is about to be moved
    Hooks.on('preUpdateAmbientSound', (ambientSound, formData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: preUpdateAmbientSound', formData);
      const aSound = ambientSound as foundry.documents.AmbientSoundDocument;
      if (aSound.effects.muffled.type !== 'lowpass') {
        aSound.effects.muffled.type = 'lowpass';
        aSound.effects.muffled.intensity = 0;
        aSound.update({
          effects: {
            muffled: { type: 'lowpass', intensity: 0 },
          },
        });
      }
    });
    // When ambient sound is about to be moved
    Hooks.on('updateAmbientSound', (ambientSound, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateAmbientSound', _updateData);
      const aSound = ambientSound as foundry.documents.AmbientSoundDocument;
      aSound.update({
        effects: {
          muffled: { type: 'lowpass', intensity: 0 },
        },
      });
      aSound.effects.muffled.type = 'lowpass';
      aSound.effects.muffled.intensity = 0;
      this._wheFramework.performMuffling();
    });
    Hooks.on('closeAmbientSoundConfig', (_soundConfig) => {
      WHEUtils.log('WHEFramework Event: closeAmbientSoundConfig');
      this._wheFramework.performMuffling();
    });
    Hooks.on('renderAmbientSoundConfig', (_app, html, _data, _options) => {
      this.modifySoundConfigForm(html);
    });
    // ---------- H O O K S ---------- //

    WHEUtils.log('HookManager hooks registered.');
  }

  /**
   * Modifies the Ambient Sound config form to hide the muffling effect and set a warning.
   * @param {HTMLElement} html - The HTMLElement object that corresponds to the Ambient Sound config form.
   */
  public modifySoundConfigForm = (html: HTMLElement) => {
    const fieldSets = html.getElementsByTagName('fieldset');
    let foundFields = false;
    for (let i = 0; i < fieldSets.length; i++) {
      const fieldset = fieldSets.item(i);
      if (fieldset) {
        const fields = fieldset.getElementsByClassName('form-group');
        for (let j = 0; j < fields.length; j++) {
          const fieldGroup = fields.item(j);
          const field = fieldGroup?.getHTML();
          if (field?.indexOf('"effects.muffled.type"') !== -1) {
            fieldGroup?.setAttribute('style', 'display:none;');
            foundFields = true;
          }
          if (field?.indexOf('"effects.muffled.intensity"') !== -1) {
            fieldGroup?.setAttribute('style', 'display:none;');
            foundFields = true;
          }
        }
        if (foundFields) {
          const hints = fieldset.getElementsByClassName('hint');
          const lastHint = hints.item(hints.length - 1);
          if (lastHint) {
            const warningText = WHEUtils.getMessageText('WHE.config.hint');
            lastHint.innerHTML = `<i>${warningText}</i>`;
          }
          break;
        }
      }
    }
  };
}
