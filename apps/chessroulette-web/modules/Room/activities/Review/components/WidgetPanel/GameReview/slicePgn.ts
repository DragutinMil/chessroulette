export function slicePgn(
  pgn: string,
  moveIndex: number,
  isBlack: 0 | 1
): string {
  const tokens = pgn.trim().split(/\s+/);

  // Sledeći broj poteza koji označava gde stajemo
  const stopMove = moveIndex + 2 + '.';

  // Pronađi indeks gde počinje sledeći potez
  let endIndex = tokens.findIndex((t) => t === stopMove);
  if (endIndex === -1) endIndex = tokens.length;

  // Uzmemo sve do tog indeksa
  let result = tokens.slice(0, endIndex);

  // Ako je poslednji igrao beli → uklanjamo zadnji token
  if (isBlack === 0 && result.length > 0) {
    result = result.slice(0, -1);
  }

  return result.join(' ');
}
