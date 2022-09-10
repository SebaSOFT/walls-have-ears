export default class WHE {
  static MODULE = "walls-have-ears";

  static SETTING_DISABLE = "client-disable";

  static SETTING_DEBUG = "client-debug";

  static STR_SETTING_DISABLE_TITLE = "WHE.settings_disable.title";

  static STR_SETTING_DISABLE_HINT = "WHE.settings_disable.hint";

  static STR_SETTING_DEBUG_TITLE = "WHE.settings_debug.title";

  static STR_SETTING_DEBUG_HINT = "WHE.settings_debug.hint";

  static debug = false;

  /**
   * Gets a translated message text
   * @param msgKey the key that will be translated, see constants
   * @param paramMap (Optional) a map of variables that should be in the translated string
   * @returns {string} the translated key or the key text
   */
  static getMessageText(msgKey, paramMap = null) {
    return (!paramMap) ? game.i18n.localize(msgKey) : game.i18n.format(msgKey, paramMap);
  }

  /**
   * Ouputs a log message if you enable WHE.debug
   * @param message Some text message to show on the console
   * @param args Optional more arguments that will be sent to console.log
   */
  static logMessage(message, ...args) {
    if (!this.debug) {
      return;
    }
    console.log(`WHE | ${message}`, ...args);
  }
}
