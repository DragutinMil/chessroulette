import { Chess } from 'chess.js';
import { OPENING_DATABASE } from './openingDatabase';

describe('OPENING_DATABASE — all moves are legal', () => {
  OPENING_DATABASE.forEach((family) => {
    describe(family.name, () => {
      family.variants.forEach((variant) => {
        test(`${variant.variantName} (${variant.eco})`, () => {
          const chess = new Chess();
          variant.moves.forEach((uci, i) => {
            const from = uci.slice(0, 2);
            const to = uci.slice(2, 4);
            const promotion = uci.length === 5 ? uci[4] : undefined;
            try {
              chess.move({ from, to, ...(promotion ? { promotion } : {}) });
            } catch {
              throw new Error(
                `Move #${i + 1} "${uci}" is illegal in "${family.name} > ${variant.variantName}". FEN before move: ${chess.fen()}`
              );
            }
          });
        });
      });
    });
  });
});
