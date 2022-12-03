export function getPlural(lang: string, plurals: string, count: number) {
  const p = plurals.split(',');
  if ((count === 0 || count > 1) && plurals.length) {
    return p[1];
  }
  return p[0];
}