export default class WHE {
  static MODULE = "walls-have-ears";

  static SETTING_TESTER = "tester-enable";

  static SETTING_DISABLE = "client-disable";

  static SETTING_DEBUG = "client-debug";

  static STR_SETTING_TESTER_TITLE = "WHE.settings_tester.title";

  static STR_SETTING_TESTER_HINT = "WHE.settings_tester.hint";

  static STR_SETTING_DISABLE_TITLE = "WHE.settings_disable.title";

  static STR_SETTING_DISABLE_HINT = "WHE.settings_disable.hint";

  static STR_SETTING_DEBUG_TITLE = "WHE.settings_debug.title";

  static STR_SETTING_DEBUG_HINT = "WHE.settings_debug.hint";

  static debug = false;

  static tokenSoundCache = {};

  /**
   * Gets the muffling level of the cache, so it compares with the resolved level
   * @param {string} tokenId The TokenId to check on the cache
   * @param {string} soundId The SoundId of the token cache
   * @returns {number} the muffling level or 0 if is not muffled
   */
  static getMufflingLevel(tokenId, soundId) {
    const sound = WHE.getMufflingObject(tokenId, soundId);
    return sound.getMufflingLevel();
  }

  /**
   * Stores the muffling level for this token and this sound, for later comparisson
   * @param {string} tokenId The TokenId to store on the cache
   * @param {string} soundId The SoundId of the token cache
   * @param {number} mufflingLevel the muffling level or 0 if is not muffled
   */
  static storeMufflingLevel(tokenId, soundId, mufflingLevel) {
    const sound = WHE.getMufflingObject(tokenId, soundId);
    sound.setMufflingLevel(mufflingLevel);
    if (!WHE.findMufflingObject(tokenId, soundId)) {
      const soundArray = WHE.tokenSoundCache[tokenId];
      if (!soundArray) {
        WHE.tokenSoundCache[tokenId] = [];
      }
      WHE.tokenSoundCache[tokenId].push(sound);
    }
  }

  /**
   * Checks if the cached muffling level is different from the provided value
   * @param {string} tokenId The TokenId to check on the cache
   * @param {string} soundId The SoundId of the token cache
   * @param {number} mufflingLevel the contesting muffling level to check the cache
   * @returns {boolean} TRUE if the muffling level is different from the cached value
   */
  static hasMufflingChanged(tokenId, soundId, mufflingLevel) {
    const sound = WHE.getMufflingObject(tokenId, soundId);
    return (sound.getMufflingLevel() !== mufflingLevel);
  }

  /**
   * Gets the muffling object of the cache, so it compares with the resolved level
   * @param {string} tokenId The TokenId to check on the cache
   * @param {string} soundId The SoundId of the token cache
   * @returns {MuffledSound} the muffling level or 0 if is not muffled
   */
  static getMufflingObject(tokenId, soundId) {
    const res = new MuffledSound(soundId, 0);
    const sound = WHE.findMufflingObject(tokenId, soundId);
    if (sound) {
      return sound;
    }
    return res;
  }

  /**
   * Finds the muffling object of the cache, if its there
   * @param {string} tokenId The TokenId to check on the cache
   * @param {string} soundId The SoundId of the token cache
   * @returns {MuffledSound|null} the muffling level or null if not found
   */
  static findMufflingObject(tokenId, soundId) {
    const tokenSounds = WHE.tokenSoundCache[tokenId] || null;
    if (tokenSounds) {
      const sound = tokenSounds.find(function(soundItem) {
        return soundItem.getId() === soundId;
      });
      if (sound) {
        return sound;
      }
    }
    return null;
  }

  /**
   * Gets a translated message text
   * @param {string} msgKey the key that will be translated, see constants
   * @param {Record<string, *>} paramMap (Optional) a map of variables that should be in the translated string
   * @returns {string} the translated key or the key text
   */
  static getMessageText(msgKey, paramMap = null) {
    return (!paramMap) ? game.i18n.localize(msgKey) : game.i18n.format(msgKey, paramMap);
  }

  /**
   * Ouputs a log message if you enable WHE.debug
   * @param {string} message Some text message to show on the console
   * @param {*[]} args Optional more arguments that will be sent to console.log
   */
  static logMessage(message, ...args) {
    if (!this.debug) {
      return;
    }
    console.log(`WHE | ${message}`, ...args);
  }
}

class MuffledSound {

  id = null;

  muffle = 0;

  /**
   * Construct a MuffledSound object
   * @param {string} soundId the sound ID for this sound
   * @param {number} mufflingLevel the muffling level for this sound or 0 to be unmuffled
   */
  constructor(soundId, mufflingLevel = 0) {
    this.id = soundId;
    this.muffle = mufflingLevel;
  }

  /**
   * Returns true if any muffling is applied
   * @returns {boolean} TRUE if any muffling is applied
   */
  isMuffled() {
    return (this.muffle > 0);
  }

  /**
   * The sound ID corresponding to the current sound
   * @returns {null|string} the sound ID or null
   */
  getId() {
    return this.id;
  }

  /**
   * Gets the muffling Level for this sound
   * @returns {number}  muffling level or 0 if not muffled
   */
  getMufflingLevel() {
    return this.muffle;
  }

  /**
   * Sets the muffling level for this sound
   * @param {number} mufflingLevel a positive float number that represents the muffling
   */
  setMufflingLevel(mufflingLevel) {
    if (mufflingLevel < 0) {
      mufflingLevel = 0;
    }
    this.muffle = mufflingLevel;
  }
}
