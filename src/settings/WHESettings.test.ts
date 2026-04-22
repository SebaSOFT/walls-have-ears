import WHESettings from './WHESettings';
import { WHEConstants } from '../utils/WHEConstants';
import { getGame } from '../foundry/getGame';

jest.mock('../foundry/getGame', () => ({
  getGame: jest.fn(),
}));

jest.mock('../utils/WHEUtils', () => ({
  getMessageText: jest.fn((key) => `Translated: ${key}`),
  log: jest.fn(),
}));

describe('WHESettings', () => {
  let mockGame: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGame = {
      settings: {
        register: jest.fn(),
        get: jest.fn(),
      },
    };

    (getGame as jest.Mock).mockReturnValue(mockGame);

    // Reset singleton instance
    (WHESettings as any).instance = undefined;
  });

  it('should be a singleton', () => {
    const instance1 = WHESettings.getInstance();
    const instance2 = WHESettings.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('initialize', () => {
    it('should register settings only once', () => {
      const instance = WHESettings.getInstance();
      
      instance.initialize();
      expect(mockGame.settings.register).toHaveBeenCalledTimes(3);

      // Call again, should not register again
      jest.clearAllMocks();
      instance.initialize();
      expect(mockGame.settings.register).not.toHaveBeenCalled();
    });

    it('should register the door muffling setting with correct default', () => {
      const instance = WHESettings.getInstance();
      instance.initialize();

      expect(mockGame.settings.register).toHaveBeenCalledWith(
        WHEConstants.MODULE,
        WHEConstants.SETTING_DOOR_MUFFLING,
        expect.objectContaining({
          key: WHEConstants.SETTING_DOOR_MUFFLING,
          type: Boolean,
          default: true,
        }),
      );
    });
  });

  describe('getBoolean', () => {
    it('should return the default value if not initialized', () => {
      const instance = WHESettings.getInstance();
      expect(instance.getBoolean('some-key', true)).toBe(true);
      expect(instance.getBoolean('some-key', false)).toBe(false);
    });

    it('should return the default value if setting is not found', () => {
      const instance = WHESettings.getInstance();
      instance.initialize();
      mockGame.settings.get.mockReturnValue(null);

      expect(instance.getBoolean('missing-key', true)).toBe(true);
    });

    it('should return the setting value if found', () => {
      const instance = WHESettings.getInstance();
      instance.initialize();
      mockGame.settings.get.mockReturnValue(true);

      expect(instance.getBoolean(WHEConstants.SETTING_DOOR_MUFFLING, false)).toBe(true);
      expect(mockGame.settings.get).toHaveBeenCalledWith(WHEConstants.MODULE, WHEConstants.SETTING_DOOR_MUFFLING);
    });
  });
});
