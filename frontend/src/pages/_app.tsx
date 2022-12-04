import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { AuthUserProvider } from '../lib/AuthContext';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../styles/theme';
import { GraphqlProvider } from '../lib/GraphqlContext';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AuthUserProvider>
        <GraphqlProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </GraphqlProvider>
      </AuthUserProvider>
    </ChakraProvider>
  );
}
