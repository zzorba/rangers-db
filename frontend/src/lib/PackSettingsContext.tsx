import React, { useCallback, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useGetPackCollectionQuery } from '../generated/graphql/apollo-schema';

type PackSettingsContextType = {
  packs: string[];
  taboo: boolean;
  refresh: () => void;
};

export const PackSettingsContext = React.createContext<PackSettingsContextType | undefined>(undefined);

export const PackSettingsContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { authUser } = useAuth();
  const { data, refetch } = useGetPackCollectionQuery({
    variables: {
      id: authUser?.uid ?? '',
    },
    skip: !authUser,
  });
  const refresh = useCallback(() => refetch({ id: authUser?.uid ?? '' }), [refetch, authUser]);
  const context = useMemo((): PackSettingsContextType | undefined => data ? {
    packs: data.settings?.pack_collection ?? [],
    taboo: data.settings?.adhere_taboos ?? false,
    refresh,
  } : undefined, [data, refresh]);
  return (
    <PackSettingsContext.Provider value={context}>
      {children}
    </PackSettingsContext.Provider>
  );
}


export function usePackSettings(): PackSettingsContextType | undefined {
  return useContext(PackSettingsContext);
}