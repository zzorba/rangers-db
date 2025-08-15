const { formatter } = require('@lingui/format-po');

const locales = ['en', 'de', 'fr', 'es', 'it', 'ru'];

if (process.env.NODE_ENV !== "production") {
  locales.push("pseudo")
}
module.exports = {
  locales,
  sourceLocale: 'en',
  pseudoLocale: 'pseudo',
  fallbackLocales: {
    default: 'en'
  },
  catalogs: [
    {
      path: 'src/translations/locales/{locale}/messages',
      include: ['src/pages', 'src/components', 'src/lib'],
      exclude: ['**/node_modules/**']
    }
  ],
  compileNamespace: 'ts',
  format: formatter({ origins: false }),
};
