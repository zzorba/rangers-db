import React, { createContext, useContext, useMemo } from 'react'
import { useGetSetNamesQuery } from '../generated/graphql/apollo-schema';
import { AspectMap, CampaignCycle, ConnectionRestrictionMap, MapLocations, PathTypeMap } from '../types/types';
import { useLingui, } from '@lingui/react';
import { I18n } from '@lingui/core';
import { t } from '@lingui/macro';
import { CategoryTranslations, DeckCardErrorTranslations, DeckErrorTranslations, getAspectMap, getCampaignCycles, getConnectinRestrictions, getDeckCardErrors, getDeckErrors, getGeneralSets, getMapLocations, getPathTypes, useCategoryTranslations } from './hooks';

interface TranslationContextType {
  deckErrors: DeckErrorTranslations;
  cardErrors: DeckCardErrorTranslations;
  aspects: AspectMap;
  approaches: { [approach: string]: string };
  paths: PathTypeMap;
  restrictions: ConnectionRestrictionMap;
  // locations: MapLocations;
  generalSets: MapLocations;
  categories: CategoryTranslations;
  locale: string;
  i18n: I18n | null;
  cycles: CampaignCycle[];
}
const TranslationContext = createContext<TranslationContextType>({
  deckErrors: getDeckErrors(),
  cardErrors: getDeckCardErrors(),
  aspects: getAspectMap(),
  paths: getPathTypes(),
  restrictions: getConnectinRestrictions(),
  generalSets: getGeneralSets(),
  cycles: getCampaignCycles(),
  approaches: {},
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
      restrictions: getConnectinRestrictions(),
      cycles: getCampaignCycles(),
      generalSets: getGeneralSets(),
      approaches: {
        conflict: t`Conflict`,
        connection: t`Connection`,
        exploration: t`Exploration`,
        reason: t`Reason`,
      },
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
