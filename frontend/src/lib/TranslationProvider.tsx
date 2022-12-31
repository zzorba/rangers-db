import React, { createContext, useContext, useMemo } from 'react'
import { useGetSetNamesQuery } from '../generated/graphql/apollo-schema';
import { AspectMap, MapLocations, PathTypeMap } from '../types/types';
import { I18nContext, useLingui, } from '@lingui/react';
import { CategoryTranslations, DeckCardErrorTranslations, DeckErrorTranslations, getAspectMap, getDeckCardErrors, getDeckErrors, getMapLocations, getPathTypes, useCategoryTranslations } from './hooks';

interface TranslationContextType {
  deckErrors: DeckErrorTranslations;
  cardErrors: DeckCardErrorTranslations;
  aspects: AspectMap;
  paths: PathTypeMap;
  locations: MapLocations;
  categories: CategoryTranslations;
  locale: string;
  i18n: any;
}
const TranslationContext = createContext<TranslationContextType>({
  deckErrors: getDeckErrors(),
  cardErrors: getDeckCardErrors(),
  aspects: getAspectMap(),
  paths: getPathTypes(),
  locations: getMapLocations(),
  categories: {},
  locale: 'en',
  i18n: null,
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
      paths: getPathTypes(),
      locations: getMapLocations(),
      categories: categoryTranslations,
      locale: i18n.locale,
      i18n,
    };
  }, [categoryTranslations, i18n]);
  return (
    <TranslationContext.Provider value={value}>
      { children }
    </TranslationContext.Provider>
  );
}
// custom hook to use the authUserContext and access authUser and loading
export const useLocale = () => useContext(TranslationContext);
