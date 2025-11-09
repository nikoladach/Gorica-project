import { useTranslation as useTranslationHook } from './translations';

// Export the translation hook
export const useTranslation = (language = 'mk') => {
  return useTranslationHook(language);
};

