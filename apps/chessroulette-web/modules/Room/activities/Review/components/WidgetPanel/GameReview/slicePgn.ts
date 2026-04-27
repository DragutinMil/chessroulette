export function slicePgn(
  pgn: string,
  moveIndex: number,
  isBlack: 0 | 1
): string {
  const tokens = pgn.trim().split(/\s+/);

  const result: string[] = [];
  let moveCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    result.push(token);

    // preskoči "1.", "2." itd
    if (token.includes('.')) continue;

    moveCount++;

    // cilj:
    // beli = 2*moveIndex + 1
    // crni = 2*moveIndex + 2
    const target = isBlack === 0 ? moveIndex * 2 + 1 : moveIndex * 2 + 2;

    if (moveCount === target) break;
  }

  return result.join(' ');
}
