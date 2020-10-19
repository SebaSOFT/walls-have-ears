
export default class WHE {
    static MODULE = 'walls-have-ears';
    static SETTING_DISABLE = 'client-disable';

    static getMessageText(msgKey) {
        return game.i18n.localize(msgKey);
    }
}
