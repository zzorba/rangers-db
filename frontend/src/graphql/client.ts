import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core';
import { LocalStorageWrapper, CachePersistor } from 'apollo3-cache-persist';
import { AuthUser } from '../lib/useFirebaseAuth';
import { setContext } from '@apollo/client/link/context';


export async function initAnonClient(): Promise<[CachePersistor<NormalizedCacheObject>, ApolloClient<NormalizedCacheObject>]> {
  const cache = new InMemoryCache();
  let newPersistor = new CachePersistor({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
    debug: true,
    trigger: 'background',
  });
  await newPersistor.restore();
  const client = new ApolloClient({
    uri: 'https://gapi.rangersdb.com/v1/graphql',
    cache,
  });
  return [newPersistor, client];
}

export async function initAuthClient(user: AuthUser): Promise<[CachePersistor<NormalizedCacheObject>, ApolloClient<NormalizedCacheObject>]> {
  const cache = new InMemoryCache();

  const authLink = setContext(async(req, { headers }) => {
    const hasuraToken = await user.user.getIdToken();
    if (hasuraToken) {
      return {
        headers: {
          ...headers,
          Authorization: `Bearer ${hasuraToken}`,
        },
      };
    }
    console.error('No hasura token when making request');
    return { headers };
  });
  const httpsLink = authLink.concat(new HttpLink({
    uri: `https://gapi.rangersdb.com/v1/graphql`,
  }));

  let newPersistor = new CachePersistor({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
    debug: true,
    trigger: 'background',
  });
  await newPersistor.restore();
  const client = new ApolloClient({
    link: httpsLink,
    cache,
  });
  return [newPersistor, client];
}
