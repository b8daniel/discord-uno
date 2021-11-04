enum TranslatedString {
  PLAYER = 'Player',
}

enum Language {
  ENGLISH = 'en',
  SPANISH = 'es',
  GERMAN = 'de',
}

const translations: { [key in Language]: { [key in TranslatedString]: string } } = {
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

export function getTranslatedString(
  key: TranslatedString,
  language: Language = Language.ENGLISH
): string {
  return translations[language][key];
}