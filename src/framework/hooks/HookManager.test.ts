import HookManager from './HookManager';
import WHEFramework from '../WHEFramework';
import { getGame } from '../../foundry/getGame';
import { WHEConstants } from '../../utils/WHEConstants';
import { libWrapper } from '../../lib/libWrapper';

let mockPlayerContext: any = {
  checkForChangedSelection: jest.fn(),
  getSelectedToken: jest.fn(),
};

// Mock dependencies
jest.mock('../WHEFramework', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      performMuffling: jest.fn(),
      getPlayerContext: jest.fn(() => mockPlayerContext), // Return the mocked PlayerContext
      initialize: jest.fn(),
    })),
  },
}));
jest.mock('../audio/SoundManager');
jest.mock('../../foundry/getGame', () => ({
  getGame: jest.fn(),
}));
jest.mock('../../lib/libWrapper', () => ({
  libWrapper: {
    register: jest.fn(),
  },
}));
jest.mock('../player/PlayerContext', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      checkForChangedSelection: jest.fn(),
      getSelectedToken: jest.fn(),
    })),
  },
}));

// Mock global Hooks
const mockHooksOn = jest.fn();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.Hooks = {
  on: mockHooksOn,
  once: jest.fn(),
  callAll: jest.fn(),
} as any;

describe('HookManager', () => {
  let mockWheFramework: jest.Mocked<WHEFramework>;
  let hookManager: HookManager;
  let mockGame: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock global Hooks
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    global.Hooks = {
      on: mockHooksOn,
      once: jest.fn(),
      callAll: jest.fn(),
    } as any;

    // Setup mock game and framework
    mockGame = {
      audio: {
        awaitFirstGesture: jest.fn().mockResolvedValue(undefined),
      },
    };
    (getGame as jest.Mock).mockReturnValue(mockGame);

    // Get the mocked instance from the mocked WHEFramework module
    mockWheFramework = WHEFramework.getInstance() as jest.Mocked<WHEFramework>;
    (mockWheFramework.performMuffling as jest.Mock).mockResolvedValue(undefined);

    // Mock PlayerContext
    mockPlayerContext = {
      checkForChangedSelection: jest.fn().mockResolvedValue(undefined),
      getSelectedToken: jest.fn().mockReturnValue({ id: 'mockToken' }),
    } as any;

    hookManager = new HookManager(mockWheFramework);
  });

  describe('registerHooks', () => {
    it('should register all required hooks', () => {
      hookManager.registerHooks();

      const registeredHooks = mockHooksOn.mock.calls.map((call) => call[0]);

      expect(registeredHooks).toContain('ready');
      expect(registeredHooks).toContain('updateToken');
      expect(registeredHooks).toContain('refreshToken');
      expect(registeredHooks).toContain('updateWall');
      expect(registeredHooks).toContain('refreshWall');
      expect(registeredHooks).toContain('controlToken');
      expect(registeredHooks).toContain('preUpdateAmbientSound');
      expect(registeredHooks).toContain('updateAmbientSound');
      expect(registeredHooks).toContain('closeAmbientSoundConfig');
      expect(registeredHooks).toContain('renderAmbientSoundConfig');
      expect(mockHooksOn).toHaveBeenCalledTimes(10);
    });

    it('should register libWrapper on "ready" hook', async () => {
      hookManager.registerHooks();

      // Find the 'ready' hook callback and execute it
      const readyCallback = mockHooksOn.mock.calls.find((call) => call[0] === 'ready')[1];
      await readyCallback();

      expect(mockGame.audio.awaitFirstGesture).toHaveBeenCalled();
      expect(mockWheFramework.performMuffling).toHaveBeenCalled();
      expect(libWrapper.register).toHaveBeenCalledWith(
        WHEConstants.MODULE,
        'foundry.canvas.placeables.Wall.prototype._playDoorSound',
        expect.any(Function),
        'MIXED',
      );
    });

    it('should call performMuffling on various update hooks', async () => {
      hookManager.registerHooks();

      const mufflingHooks = [
        'updateToken',
        'refreshToken',
        'updateWall',
        'refreshWall',
        'controlToken',
        'updateAmbientSound',
        'closeAmbientSoundConfig',
      ];

      for (const hookName of mufflingHooks) {
        const hookCallback = mockHooksOn.mock.calls.find((call) => call[0] === hookName)[1];
        if (hookName === 'updateAmbientSound') {
          const mockAmbientSound = {
            update: jest.fn(),
            effects: { muffled: { type: 'lowpass', intensity: 0 } },
          };
          await hookCallback(mockAmbientSound);
        } else {
          await hookCallback();
        }
      }

      expect(mockWheFramework.performMuffling).toHaveBeenCalledTimes(mufflingHooks.length);
    });

    it('should call checkForChangedSelection on "controlToken" hook', async () => {
      hookManager.registerHooks();
      const controlTokenCallback = mockHooksOn.mock.calls.find((call) => call[0] === 'controlToken')[1];

      const mockToken: any = { id: 'token1' };
      await controlTokenCallback(mockToken, true);

      expect(mockPlayerContext.checkForChangedSelection).toHaveBeenCalledWith(mockToken, true);
      expect(mockWheFramework.performMuffling).toHaveBeenCalledTimes(1);
    });

    it('should call modifySoundConfigForm on "renderAmbientSoundConfig" hook', () => {
      // Spy on the method to ensure it's called, without testing its internal DOM logic here
      const modifySpy = jest.spyOn(hookManager, 'modifySoundConfigForm');
      hookManager.registerHooks();
      const renderConfigCallback = mockHooksOn.mock.calls.find((call) => call[0] === 'renderAmbientSoundConfig')[1];

      const mockHtml = document.createElement('div');
      renderConfigCallback(null, mockHtml, null, null);

      expect(modifySpy).toHaveBeenCalledWith(mockHtml);
      modifySpy.mockRestore();
    });
  });
});
