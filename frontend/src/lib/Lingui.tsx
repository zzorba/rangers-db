import { i18n, Messages } from "@lingui/core"
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { useRouter } from "next/router"
import { useEffect } from "react";

export type LOCALES = 'en' | 'de' | 'it' | 'fr' | 'pseudo';

export async function loadCatalog(locale: string) {
  const { messages } = await import(`@lingui/loader!../translations/locales/${locale}/messages.po`);
  return messages;
}

export function useLinguiInit(messages: Messages) {
  const router = useRouter();
  const locale = router.locale || router.defaultLocale!;
  const isClient = typeof window !== "undefined";

  if (!isClient && locale !== i18n.locale) {
    // there is single instance of i18n on the server
    i18n.loadAndActivate({ locale, messages });
  }
  if (isClient && i18n.locale === undefined) {
    // first client render
    i18n.loadAndActivate({ locale, messages });
  }

  useEffect(() => {
    const localeDidChange = locale !== i18n.locale;
    if (localeDidChange) {
      console.log('Locale changed');
      i18n.loadAndActivate({ locale, messages });
    }
  }, [locale, messages]);

  return i18n;
}


export async function getLocalizationServerSideProps(
  ctx: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<any>> {
  // some server side logic
  return {
    props: {
      i18n: await loadCatalog(ctx.locale as string),
    },
  };
}
