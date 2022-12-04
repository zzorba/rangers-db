import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client';
import { Text } from '@chakra-ui/react';
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
  const [anonPersistor, setAnonPersistor] = useState<CachePersistor<NormalizedCacheObject>>();
  const [authClient, setAuthClient] = useState<ApolloClient<NormalizedCacheObject>>();
  const [authPersistor, setAuthPersistor] = useState<CachePersistor<NormalizedCacheObject>>();
  useEffect(() => {
    initAnonClient().then(([cachePersistor, client]) => {
      setAnonPersistor(cachePersistor);
      setAnonClient(client);
    }, console.error);
  }, []);
  const { authUser } = useAuth();
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
    anonPersistor?.purge();
  }, [authPersistor, anonPersistor]);
  if (!anonClient) {
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
