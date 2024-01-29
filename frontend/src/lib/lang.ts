export function getPlural(lang: string, plurals: string, count: number) {
  const p = plurals.split(',');
  switch (lang) {
    case 'en':
    case 'de':
    case 'it':
    case 'fr':
    case 'ru':
      default:
      if (count !== 1 && plurals.length) {
        return p[1];
      }
      return p[0];
  }
}