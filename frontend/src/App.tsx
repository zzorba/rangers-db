import React, { useCallback, useEffect, useState } from 'react';
import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client';
import { CachePersistor } from 'apollo3-cache-persist';
import { ChakraProvider, Heading, Container, Text, Button } from '@chakra-ui/react'
import { t } from 'ttag';

import logo from './logo.svg';
import './App.css';
import { initClient } from './graphql/client';
import CardList from './CardList';
import theme from './theme';

function App() {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>();
  const [persistor, setPersistor] = useState<CachePersistor<NormalizedCacheObject>>();
  useEffect(() => {
    initClient().then(([cachePersistor, client]) => {
      setPersistor(cachePersistor);
      setClient(client);
    }, console.error);
  }, []);
  const clearCache = useCallback(() => {
    if (!persistor) {
      return;
    }
    persistor.purge();
    window.location.reload();
  }, [persistor]);
  if (!client) {
    return <div>Loading</div>;
  }
  return (
    <ChakraProvider theme={theme}>
      <ApolloProvider client={client}>
        <Container maxW="container.lg">
          <Heading>{t`RangersDB`}</Heading>
          <Text>This site is a WIP. Deckbuilding coming soon.</Text>
          <CardList />
        </Container>
        <Container as="footer" role="contentinfo" py={{ base: '12', md: '16' }}>
          <Text fontSize="sm" color="subtle">
            {t`The information presented on this site about Earthborne Rangers, both literal and graphical, is copyrighted by Earthborne Games. This website is not produced, endorsed, supported, or affiliated with Earthborne Games.`}
          </Text>
          <Button marginTop={4} onClick={clearCache}>{t`Clear Cache`}</Button>
        </Container>
      </ApolloProvider>
    </ChakraProvider>
  );
}

export default App;
