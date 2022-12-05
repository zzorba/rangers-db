import React, { createContext, useContext, useMemo } from 'react'
import { DeckCardErrorTranslations, DeckErrorTranslations, getDeckCardErrors, getDeckErrors, useDeckErrors } from './hooks';

interface TranslationContextType {
  deckErrors: DeckErrorTranslations;
  cardErrors: DeckCardErrorTranslations;
}
const TranslationContext = createContext<TranslationContextType>({
  deckErrors: getDeckErrors(),
  cardErrors: getDeckCardErrors(),
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => {
    return {
      deckErrors: getDeckErrors(),
      cardErrors: getDeckCardErrors(),
    };
  }, []);
  return (
    <TranslationContext.Provider value={value}>
      { children }
    </TranslationContext.Provider>
  );
}
// custom hook to use the authUserContext and access authUser and loading
export const useTranslations = () => useContext(TranslationContext);
