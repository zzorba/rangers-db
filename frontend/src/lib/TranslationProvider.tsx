import React, { createContext, useContext, useMemo } from 'react'
import { useGetSetNamesQuery } from '../generated/graphql/apollo-schema';
import { AspectMap } from '../types/types';
import { useLingui } from '@lingui/react';
import { CategoryTranslations, DeckCardErrorTranslations, DeckErrorTranslations, getAspectMap, getDeckCardErrors, getDeckErrors, useCategoryTranslations } from './hooks';

interface TranslationContextType {
  deckErrors: DeckErrorTranslations;
  cardErrors: DeckCardErrorTranslations;
  aspects: AspectMap;
  categories: CategoryTranslations;
  locale: string;
}
const TranslationContext = createContext<TranslationContextType>({
  deckErrors: getDeckErrors(),
  cardErrors: getDeckCardErrors(),
  aspects: getAspectMap(),
  categories: {},
  locale: 'en',
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useLingui();
  const { data: setData } = useGetSetNamesQuery({
    variables: {
      locale: i18n.locale,
    },
  });
  const categoryTranslations = useCategoryTranslations(setData?.sets);
  const value: TranslationContextType = useMemo(() => {
    return {
      deckErrors: getDeckErrors(),
      cardErrors: getDeckCardErrors(),
      aspects: getAspectMap(),
      categories: categoryTranslations,
      locale: i18n.locale,
    };
  }, [categoryTranslations, i18n.locale]);
  return (
    <TranslationContext.Provider value={value}>
      { children }
    </TranslationContext.Provider>
  );
}
// custom hook to use the authUserContext and access authUser and loading
export const useLocale = () => useContext(TranslationContext);
