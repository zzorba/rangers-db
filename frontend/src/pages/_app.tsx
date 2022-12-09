import '../styles/globals.css'
import '../styles/core.css';
import App, { AppContext, AppProps } from 'next/app'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react';

import { AuthUserProvider } from '../lib/AuthContext';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../styles/theme';
import { GraphqlProvider } from '../lib/GraphqlContext';
import Layout from '../components/Layout';
import { TranslationProvider } from '../lib/TranslationProvider';
import { getTranslation, initTranslation } from '../lib/Lingui';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

initTranslation(i18n)

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const locale = router.locale || router.defaultLocale;
  const firstRender = useRef(true);
  if (firstRender.current && locale && pageProps?.translation) {
    // load the translations for the locale
    i18n.load(locale, pageProps.translation);
    i18n.activate(locale);
    // render only once
    firstRender.current = false;
  }
  useEffect(() => {
    if (pageProps?.translation && locale) {
      i18n.load(locale, pageProps.translation);
      i18n.activate(locale);
      firstRender.current = false;

    }
  }, [locale, pageProps?.translation])

  return (
    <I18nProvider i18n={i18n} forceRenderOnLocaleChange={false}>
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
    </I18nProvider>
  );
}

let translation: any | null = null;

MyApp.getInitialProps = async(appContext: AppContext) => {
  const original = App.getInitialProps(appContext);
  if (!translation) {
    const locale = appContext.ctx.locale || 'en';
    translation = await getTranslation(locale);
  }
  return {
    ...original,
    pageProps: {
      translation,
    },
  };
}
export default MyApp;