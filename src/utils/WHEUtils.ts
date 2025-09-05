import WHEBaseObject from '../canvas/WHEBaseObject';

export default class WHEUtils {
  public static debug: boolean = false;
  private static cache: {
    [key: string]: WHEBaseObject;
  } = {};

  /**
   * Logs a message to the console, but only if debug mode is enabled.
   *
   * @param message
   */
  public static log = (message: string): void => {
    if (!WHEUtils.debug) {
      return;
    }
    console.log(`[WHE] ${message}`);
  };

  /**
   * Gets a translated message text
   * @param {string} msgKey the key that will be translated, see constants
   * @param {Record<string, any>} paramMap (Optional) a map of variables that should be in the translated string
   * @returns {string} the translated key or the key text
   */
  public static getMessageText = (msgKey: string, paramMap: Record<string, any> | null = null): string => {
    return !paramMap ? game.i18n!.localize(msgKey) : game.i18n!.format(msgKey, paramMap);
  };

  /**
   * Clamps a number between a minimum and maximum value.
   *
   * @param num The number to clamp
   * @param min The minimum value
   * @param max The maximum value
   */
  public static clamp = (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  };

  /**
   * Get memory cached item by the key
   *
   * @param cacheKey The key in which the item is cached
   */
  public static getCachedItem = (cacheKey: string): WHEBaseObject => {
    return WHEUtils.cache[cacheKey];
  };

  /**
   * Set memory cached item by the key
   *
   * @param cacheKey The key to cache the item under
   * @param item The item to cache
   */
  public static setCachedItem = (cacheKey: string, item: WHEBaseObject): void => {
    WHEUtils.cache[cacheKey] = item;
  };
}
