import '../styles/globals.css'
import '../styles/core.css';

import type { AppProps } from 'next/app'

import { AuthUserProvider } from '../lib/AuthContext';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../styles/theme';
import { GraphqlProvider } from '../lib/GraphqlContext';
import Layout from '../components/Layout';
import { TranslationProvider } from '../lib/TranslationProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AuthUserProvider>
        <GraphqlProvider>
          <TranslationProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </TranslationProvider>
        </GraphqlProvider>
      </AuthUserProvider>
    </ChakraProvider>
  );
}
