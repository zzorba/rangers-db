import '../styles/globals.css'
import '../styles/core.css';

import React, { FunctionComponent } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { AppProps } from 'next/app'
import { I18nContext, I18nProviderProps, LinguiContext } from '@lingui/react';

import { AuthUserProvider } from '../lib/AuthContext';
import theme from '../styles/theme';
import { GraphqlProvider } from '../lib/GraphqlContext';
import Layout from '../components/Layout';
import { TranslationProvider } from '../lib/TranslationProvider';
import { useLinguiInit } from '../lib/Lingui';
import { ThemeContextProvider } from '../lib/ThemeContext';
import { useRouter } from 'next/router';

const I18nProvider: FunctionComponent<I18nProviderProps & { forceRenderOnLocaleChange?: boolean }> = ({
  i18n,
  defaultComponent,
  forceRenderOnLocaleChange = true,
  children,
}) => {
  /**
   * We can't pass `i18n` object directly through context, because even when locale
   * or messages are changed, i18n object is still the same. Context provider compares
   * reference identity and suggested workaround is create a wrapper object every time
   * we need to trigger re-render. See https://reactjs.org/docs/context.html#caveats.
   *
   * Due to this effect we also pass `defaultComponent` in the same context, instead
   * of creating a separate Provider/Consumer pair.
   *
   * We can't use useMemo hook either, because we want to recalculate value manually.
   */
  const makeContext = () => ({
    i18n,
    defaultComponent,
  })
  const getRenderKey = () => {
    return (
      forceRenderOnLocaleChange ? i18n.locale || "default" : "default"
    ) as string
  }

  const [context, setContext] = React.useState<I18nContext>(makeContext() as any),
    [renderKey, setRenderKey] = React.useState<string>(getRenderKey())

  /**
   * Subscribe for locale/message changes
   *
   * I18n object from `@lingui/core` is the single source of truth for all i18n related
   * data (active locale, catalogs). When new messages are loaded or locale is changed
   * we need to trigger re-rendering of LinguiContext.Consumers.
   *
   * We call `setContext(makeContext())` after adding the observer in case the `change`
   * event would already have fired between the inital renderKey calculation and the
   * `useEffect` hook being called. This can happen if locales are loaded/activated
   * async.
   */
  React.useEffect(() => {
    const unsubscribe = i18n.on("change", () => {
      setContext(makeContext() as any)
      setRenderKey(getRenderKey())
    })
    if (renderKey === "default") {
      setRenderKey(getRenderKey())
    }
    if (forceRenderOnLocaleChange && renderKey === "default") {
      console.log(
        "I18nProvider did not render. A call to i18n.activate still needs to happen or forceRenderOnLocaleChange must be set to false."
      )
    }
    return () => unsubscribe()
    // eslint-disable-next-line
  }, [])

  if (forceRenderOnLocaleChange && renderKey === "default") return null

  return (
    <LinguiContext.Provider value={context} key={renderKey}>
      {children}
    </LinguiContext.Provider>
  )
}
function MyApp({ Component, pageProps }: AppProps) {
  const initializedI18n = useLinguiInit(pageProps.i18n);
  return (
    <I18nProvider i18n={initializedI18n} forceRenderOnLocaleChange>
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
