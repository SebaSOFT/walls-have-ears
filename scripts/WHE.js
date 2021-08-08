export default class WHE {
    static MODULE = 'walls-have-ears';

    static SETTING_DISABLE = 'client-disable';

    static STR_SETTING_DISABLE_TITLE = 'WHE.settings_disable.title';
    static STR_SETTING_DISABLE_HINT = 'WHE.settings_disable.hint';

    static debug = false;

    /**
     * Gets a translated message text
     * @param msgKey the key that will be translated, see constants
     * @returns {string} the translated key or the key text
     */
    static getMessageText(msgKey) {
        return game.i18n.localize(msgKey);
    }

    /**
     * Ouputs a log message if you enable WHE.debug
     * @param message Some text message to show on the console
     * @param args Optional more arguments that will be sent to console.log
     */
    static logMessage(message, args) {
        if (!this.debug) {
            return;
        }
        console.log('WHE | ' + message, args);
    }
}
