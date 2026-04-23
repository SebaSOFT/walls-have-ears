import { WHEConstants } from '../utils/WHEConstants';
import WHEUtils from '../utils/WHEUtils';
import { getGame } from '../foundry/getGame';

export default class WHESettings {
  private static instance: WHESettings;
  private initialized = false;
  private readonly settings: readonly [string, Partial<ClientSettings.SettingConfig>][];
  private constructor() {
    this.settings = [
      [
        WHEConstants.SETTING_DEBUG,
        {
          name: 'WHE.settings_debug.title',
          hint: 'WHE.settings_debug.hint',
          key: WHEConstants.SETTING_DEBUG,
          namespace: WHEConstants.MODULE,
          scope: 'client',
          config: true,
          type: Boolean,
          default: false,
          onChange: (value: any, _options?: Omit<ClientSettings.SetOptions, 'document'>) => {
            WHEUtils.debug = value;
          },
          requiresReload: false,
        },
      ],
      [
        WHEConstants.SETTING_TESTER,
        {
          name: 'WHE.settings_tester.title',
          hint: 'WHE.settings_tester.hint',
          key: WHEConstants.SETTING_TESTER,
          namespace: WHEConstants.MODULE,
          scope: 'client',
          config: true,
          type: Boolean,
          default: false,
          requiresReload: false,
        },
      ],
      [
        WHEConstants.SETTING_DOOR_MUFFLING,
        {
          name: 'WHE.settings_door_muffling.title',
          hint: 'WHE.settings_door_muffling.hint',
          key: WHEConstants.SETTING_DOOR_MUFFLING,
          namespace: WHEConstants.MODULE,
          scope: 'client',
          config: true,
          type: Boolean,
          default: true,
          requiresReload: false,
        },
      ],
      [
        WHEConstants.SETTING_FLOOR_THICKNESS,
        {
          name: 'WHE.settings_floor_thickness.title',
          hint: 'WHE.settings_floor_thickness.hint',
          key: WHEConstants.SETTING_FLOOR_THICKNESS,
          namespace: WHEConstants.MODULE,
          scope: 'world',
          config: true,
          type: Number,
          default: 10,
          requiresReload: false,
        },
      ],
      [
        WHEConstants.SETTING_HEARING_HEIGHT,
        {
          name: 'WHE.settings_hearing_height.title',
          hint: 'WHE.settings_hearing_height.hint',
          key: WHEConstants.SETTING_HEARING_HEIGHT,
          namespace: WHEConstants.MODULE,
          scope: 'world',
          config: true,
          type: Number,
          default: 6,
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
      getGame().settings.register(WHEConstants.MODULE as any, setting[0] as any, setting[1] as any);
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
  public getBoolean = (settingKey: string, defaultValue = false): boolean => {
    if (!this.initialized) {
      return defaultValue;
    }
    const res: boolean | null = getGame().settings.get(WHEConstants.MODULE as any, settingKey as any) as boolean | null;
    if (res === null) {
      return defaultValue;
    }
    return res;
  };

  /**
   * Get a Number setting for the module
   * Note: you can call this after the Init Hook has finished
   *
   * @param settingKey The Settings Key. See WHEconstants
   * @param defaultValue  The default value to return if the setting is not found
   */
  public getNumber = (settingKey: string, defaultValue = 0): number => {
    if (!this.initialized) {
      return defaultValue;
    }
    const res: number | null = getGame().settings.get(WHEConstants.MODULE as any, settingKey as any) as number | null;
    if (res === null) {
      return defaultValue;
    }
    return res;
  };
}
