import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client';
import { CachePersistor } from 'apollo3-cache-persist';

import { initAnonClient, initAuthClient } from '../graphql/client';
import { useAuth } from './AuthContext';
import LoadingPage from '../components/LoadingPage';

interface GraphqlContextType {
  authClient?: ApolloClient<NormalizedCacheObject>;
  anonClient: ApolloClient<NormalizedCacheObject>;
  purge: () => void;
}

// eslint-disable-next-line
export const GraphqlContext = React.createContext<GraphqlContextType>({
  // @ts-ignore TS2345
  authClient: null,
  // @ts-ignore TS2345
  anonClient: null,
});

export function GraphqlProvider({ children }: { children: React.ReactNode }) {
  const [anonClient, setAnonClient] = useState<ApolloClient<NormalizedCacheObject>>();
  const [anonPurge, setAnonPurge] = useState<() => Promise<void>>();
  const [authClient, setAuthClient] = useState<ApolloClient<NormalizedCacheObject>>();
  const [authPersistor, setAuthPersistor] = useState<CachePersistor<NormalizedCacheObject>>();
  useEffect(() => {
    initAnonClient().then(([client, anonPurge]) => {
      setAnonClient(client);
      setAnonPurge(anonPurge);
    }, console.error);
  }, []);
  const { authUser, loading } = useAuth();
  useEffect(() => {
    if (authUser) {
      initAuthClient(authUser).then(([cachePersistor, client]) => {
        setAuthPersistor(cachePersistor);
        setAuthClient(client);
      }, console.error);
    }
  }, [authUser]);
  const purge = useCallback(() => {
    authPersistor?.purge();
    anonPurge?.();
  }, [authPersistor, anonPurge]);
  if (!anonClient || loading || (authUser && !authClient)) {
    return <LoadingPage />;
  }
  return (
    <ApolloProvider client={authClient || anonClient}>
      <GraphqlContext.Provider value={{ authClient, anonClient, purge }}>
        {children}
      </GraphqlContext.Provider>
    </ApolloProvider>
  );
}

export const useGraphql = () => useContext(GraphqlContext);
