import WHEUtils from './WHEUtils';

describe('WHEUtils', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('log', () => {
    it('should log a message when debug is true', () => {
      WHEUtils.debug = true;
      WHEUtils.log('Test message');
      expect(consoleSpy).toHaveBeenCalledWith('[WHE] | Test message');
    });

    it('should not log a message when debug is false', () => {
      WHEUtils.debug = false;
      WHEUtils.log('Test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('clamp', () => {
    it('should clamp a number within the range', () => {
      expect(WHEUtils.clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp a number below the minimum', () => {
      expect(WHEUtils.clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp a number above the maximum', () => {
      expect(WHEUtils.clamp(15, 0, 10)).toBe(10);
    });

    it('should handle negative min and max', () => {
      expect(WHEUtils.clamp(-5, -10, -2)).toBe(-5);
    });
  });

  describe('cache', () => {
    it('should set and get a cached item', () => {
      const item = 1;
      WHEUtils.setCachedItem('testKey', item);
      expect(WHEUtils.getCachedItem('testKey')).toBe(item);
    });

    it('should return undefined for a non-existent cached item', () => {
      expect(WHEUtils.getCachedItem('nonExistentKey')).toBeUndefined();
    });

    it('should overwrite an existing cached item', () => {
      const item1 = 1;
      const item2 = 2;
      WHEUtils.setCachedItem('overwriteKey', item1);
      WHEUtils.setCachedItem('overwriteKey', item2);
      expect(WHEUtils.getCachedItem('overwriteKey')).toBe(item2);
    });
  });
});
