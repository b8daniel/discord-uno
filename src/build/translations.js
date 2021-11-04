"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslatedString = void 0;
var TranslatedString;
(function (TranslatedString) {
    TranslatedString["PLAYER"] = "Player";
})(TranslatedString || (TranslatedString = {}));
var Language;
(function (Language) {
    Language["ENGLISH"] = "en";
    Language["SPANISH"] = "es";
    Language["GERMAN"] = "de";
})(Language || (Language = {}));
const translations = {
    [Language.ENGLISH]: {
        [TranslatedString.PLAYER]: 'Player',
    },
    [Language.SPANISH]: {
        [TranslatedString.PLAYER]: 'Jugador',
    },
    [Language.GERMAN]: {
        [TranslatedString.PLAYER]: 'Spieler',
    },
};
function getTranslatedString(key, language = Language.ENGLISH) {
    return translations[language][key];
}
exports.getTranslatedString = getTranslatedString;
