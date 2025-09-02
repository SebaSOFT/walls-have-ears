import assert from 'assert';
import { WHEConstants } from '../utils/WHEConstants';
import WHEUtils from '../utils/WHEUtils';

assert(game instanceof foundry.Game);
const g = game as foundry.Game;

export default class WHESettings {
  private static instance: WHESettings;
  private initialized: boolean = false;
  private readonly settings: ReadonlyArray<[string, Partial<ClientSettings.SettingConfig>]>;
  private constructor() {
    this.settings = [
      [
        WHEConstants.SETTING_DEBUG,
        {
          name: WHEUtils.getMessageText('WHE.settings_debug.title'),
          hint: WHEUtils.getMessageText('WHE.settings_debug.hint'),
          key: WHEConstants.SETTING_DEBUG,
          namespace: WHEConstants.MODULE,
          scope: 'client',
          config: true,
          type: Boolean,
          default: false,
          onChange: (value: unknown, _options?: Omit<ClientSettings.SetOptions, 'document'>) => {
            console.log('BORRAME', value);
            assert(value instanceof Boolean);
            WHEUtils.debug = value.valueOf();
          },
          requiresReload: false,
        },
      ],
      [
        WHEConstants.SETTING_TESTER,
        {
          name: WHEUtils.getMessageText('WHE.settings_tester.title'),
          hint: WHEUtils.getMessageText('WHE.settings_tester.hint'),
          key: WHEConstants.SETTING_TESTER,
          namespace: WHEConstants.MODULE,
          scope: 'client',
          config: true,
          type: Boolean,
          default: false,
          requiresReload: false,
        },
      ],
    ];
  }

  public static getInstance = () => {
    if (!WHESettings.instance) {
      WHESettings.instance = new WHESettings();
    }
    return WHESettings.instance;
  };

  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.settings.forEach((setting) => {
      assert(g.settings instanceof foundry.helpers.ClientSettings);
      g.settings.register(WHEConstants.MODULE as any, setting[0] as any, setting[1] as any);
    });

    this.initialized = true;
  }

  /**
   * Get a Boolean setting for the module
   * Note: you can call this after the Init Hook has finished
   *
   * @param settingKey The Settings Key. See WHEconstants
   * @param defaultValue  The default value to return if the setting is not found
   */
  public getBoolean = (settingKey: string, defaultValue: boolean = false): boolean => {
    if (!this.initialized) {
      return defaultValue;
    }
    const res: boolean | null = g.settings.get(WHEConstants.MODULE as any, settingKey as any) as boolean | null;
    if (res === null) {
      return defaultValue;
    }
    return res;
  };
}
