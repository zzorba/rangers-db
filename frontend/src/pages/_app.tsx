import '../styles/globals.css'
import '../styles/core.css';
import { AppProps } from 'next/app'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { AuthUserProvider } from '../lib/AuthContext';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../styles/theme';
import { GraphqlProvider } from '../lib/GraphqlContext';
import Layout from '../components/Layout';
import { TranslationProvider } from '../lib/TranslationProvider';
import { getTranslation, initTranslation } from '../lib/Lingui';
import { ThemeContextProvider } from '../lib/ThemeContext';

initTranslation(i18n)

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const locale = router.locale || router.defaultLocale || 'en';
  useEffect(() => {
    getTranslation(locale).then(translation => {
      i18n.load(locale, translation);
      i18n.activate(locale);
    });
  }, [locale])

  return (
    <I18nProvider i18n={i18n} forceRenderOnLocaleChange>
      <ChakraProvider theme={theme}>
        <ThemeContextProvider>
          <AuthUserProvider>
            <GraphqlProvider>
              <TranslationProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </TranslationProvider>
            </GraphqlProvider>
          </AuthUserProvider>
        </ThemeContextProvider>
      </ChakraProvider>
    </I18nProvider>
  );
}

export default MyApp;