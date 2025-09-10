import PlayerContext from './PlayerContext';
import { getGame } from '../../foundry/getGame';

// Mock the getGame utility
jest.mock('../../foundry/getGame', () => ({
  getGame: jest.fn(),
}));

// Mock the global ui object
const mockWarn = jest.fn();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.ui = {
  notifications: {
    warn: mockWarn,
  },
} as any;

describe('PlayerContext', () => {
  let mockGame: any;
  let playerContext: PlayerContext;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock game object for a clean state
    mockGame = {
      user: {
        character: null,
      },
      canvas: {
        tokens: {
          controlled: [],
        },
      },
    };

    (getGame as jest.Mock).mockReturnValue(mockGame);

    // Reset singleton instance for isolation between tests
    (PlayerContext as any).instance = null;
    playerContext = PlayerContext.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = PlayerContext.getInstance();
    const instance2 = PlayerContext.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('getSelectedToken', () => {
    it('should return null initially', () => {
      expect(playerContext.getSelectedToken()).toBeNull();
    });
  });

  describe('checkForChangedSelection', () => {
    const mockToken: any = { id: 'token1', name: 'Test Token' };

    it('should set the selected token when a token is selected', async () => {
      await playerContext.checkForChangedSelection(mockToken, true);
      expect(playerContext.getSelectedToken()).toBe(mockToken);
    });

    it('should clear the selected token and find the user character token when deselected', async () => {
      const characterToken: any = { id: 'charToken', getActiveTokens: () => [characterToken] };
      mockGame.user.character = {
        getActiveTokens: () => [characterToken],
      };

      // First select a token
      await playerContext.checkForChangedSelection(mockToken, true);
      expect(playerContext.getSelectedToken()).toBe(mockToken);

      // Then deselect it
      await playerContext.checkForChangedSelection(mockToken, false);
      expect(playerContext.getSelectedToken()).toBe(characterToken);
    });

    it('should set selectedToken to null if no character token is found on deselection', async () => {
      mockGame.user.character = {
        getActiveTokens: () => [],
      };
      await playerContext.checkForChangedSelection(mockToken, true);
      await playerContext.checkForChangedSelection(mockToken, false);
      expect(playerContext.getSelectedToken()).toBeNull();
    });
  });

  describe('getActingToken (private method, tested via checkForChangedSelection)', () => {
    const token1: any = { id: 'token1', actor: { id: 'actor1' }, document: { actorLink: true } };
    const token2: any = { id: 'token2', actor: { id: 'actor2' }, document: { actorLink: true } };

    it('should return null if multiple tokens are controlled', async () => {
      mockGame.canvas.tokens.controlled = [token1, token2];
      await playerContext.checkForChangedSelection(token1, false); // Trigger getActingToken
      expect(playerContext.getSelectedToken()).toBeNull();
    });

    it('should return the user character active token if no token is controlled', async () => {
      const characterToken: any = { id: 'charToken' };
      mockGame.user.character = {
        getActiveTokens: () => [characterToken],
      };
      await playerContext.checkForChangedSelection(token1, false);
      expect(playerContext.getSelectedToken()).toBe(characterToken);
    });

    it('should return null and warn if multiple active tokens for a character are found', async () => {
      const charToken1: any = { id: 'charToken1' };
      const charToken2: any = { id: 'charToken2' };
      mockGame.user.character = {
        getActiveTokens: () => [charToken1, charToken2],
      };

      // Manually call the private method for this specific test case
      const result = (playerContext as any).getActingToken({ warn: true });

      expect(result).toBeNull();
      expect(mockWarn).toHaveBeenCalledWith(
        'WHE: Multiple possible acting tokens found. Please select a single token.',
      );
    });

    it('should return a single controlled token', async () => {
      mockGame.canvas.tokens.controlled = [token1];
      // Deselecting another token to trigger the logic
      await playerContext.checkForChangedSelection(token2, false);
      expect(playerContext.getSelectedToken()).toBe(token1);
    });
  });
});
