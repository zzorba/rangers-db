import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core';
import { persistCache, LocalStorageWrapper, CachePersistor } from 'apollo3-cache-persist';

export async function initClient(): Promise<[CachePersistor<NormalizedCacheObject>, ApolloClient<NormalizedCacheObject>]> {
  const cache = new InMemoryCache();
  let newPersistor = new CachePersistor({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
    debug: true,
    trigger: 'write',
  });
  await newPersistor.restore();
  const client = new ApolloClient({
    uri: 'https://gapi.rangersdb.com/v1/graphql',
    cache,
  });
  return [newPersistor, client];
}
