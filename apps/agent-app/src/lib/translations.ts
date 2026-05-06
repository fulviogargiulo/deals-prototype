export type Language = 'en' | 'es';

type TranslationMap = Record<string, Record<Language, string>>;

const translations: TranslationMap = {
  // Profile sheet - main menu
  'profile.workDocuments': { en: 'Work documents', es: 'Documentos de trabajo' },
  'profile.personalDetails': { en: 'Personal details', es: 'Datos personales' },
  'profile.language': { en: 'Language', es: 'Idioma' },
  'profile.support': { en: 'Support', es: 'Soporte' },
  'profile.privacyPolicy': { en: 'Privacy policy', es: 'Política de privacidad' },
  'profile.logOut': { en: 'Log out', es: 'Cerrar sesión' },

  // Profile sheet - personal details
  'profile.name': { en: 'Name', es: 'Nombre' },
  'profile.location': { en: 'Location', es: 'Ubicación' },
  'profile.phoneNumber': { en: 'Phone number', es: 'Número de teléfono' },
  'profile.emailAddress': { en: 'Email address', es: 'Correo electrónico' },

  // Language options
  'language.english': { en: 'English', es: 'English' },
  'language.spanish': { en: 'Español', es: 'Español' },
  'language.title': { en: 'Language', es: 'Idioma' },
};

export function translate(key: string, language: Language): string {
  return translations[key]?.[language] ?? key;
}
