module.exports = {
  locales: ['en', 'de', 'fr', 'it', 'pseudo'],
  pseudoLocale: 'pseudo',
  sourceLocale: 'en',
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
  format: 'po'
}