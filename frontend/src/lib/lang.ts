export function getPlural(lang: string, plurals: string, count: number) {
  const p = plurals.split(',');
  switch (lang) {
    case 'en':
    case 'de':
    case 'it':
    case 'fr':
    default: {
      if (count !== 1 && plurals.length) {
        return p[1];
      }
      return p[0];
    }
    case 'ru': {
      if (plurals.length !== 3) {
        return plurals[0];
      }
      if (count % 10 === 1 && count % 100 !== 11) {
        return p[0];
      }
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
        return p[1];
      }
      return p[2];
    }
  }
}