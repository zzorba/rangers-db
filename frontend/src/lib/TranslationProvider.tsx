import React, { createContext, useContext, useMemo } from 'react'
import { AspectMap } from '../types/types';
import { DeckCardErrorTranslations, DeckErrorTranslations, getAspectMap, getDeckCardErrors, getDeckErrors, useDeckErrors } from './hooks';

interface TranslationContextType {
  deckErrors: DeckErrorTranslations;
  cardErrors: DeckCardErrorTranslations;
  aspects: AspectMap;
}
const TranslationContext = createContext<TranslationContextType>({
  deckErrors: getDeckErrors(),
  cardErrors: getDeckCardErrors(),
  aspects: getAspectMap(),
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => {
    return {
      deckErrors: getDeckErrors(),
      cardErrors: getDeckCardErrors(),
      aspects: getAspectMap(),
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
