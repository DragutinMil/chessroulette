import React from 'react';
import { PieceSan, ShortChessColor, getNewChessGame } from '@xmatter/util-kit';
import { useTheme } from '@app/hooks/useTheme/useTheme';
import { useIsTablet } from '@app/hooks/useIsTablet';

export type MaterialAdvantageData = {
  pieces: PieceSan[];
  score: number;
};

const MATERIAL_ROLES = ['q', 'r', 'b', 'n', 'p'] as const;
const MATERIAL_VALUES = { q: 9, r: 5, b: 3, n: 3, p: 1 };
const PIECE_SIZE_PX = { mobile: 16, desktop: 20 };

// lichess stil: po tipu figure belo minus crno, prikazuje se samo visak + razlika u materijalu
export const getMaterialAdvantage = (
  pgn: string
): Record<ShortChessColor, MaterialAdvantageData> => {
  const diff = { q: 0, r: 0, b: 0, n: 0, p: 0 };

  getNewChessGame({ pgn })
    .board()
    .forEach((row) =>
      row.forEach((square) => {
        if (square && square.type !== 'k') {
          diff[square.type] += square.color === 'w' ? 1 : -1;
        }
      })
    );

  const result: Record<ShortChessColor, MaterialAdvantageData> = {
    w: { pieces: [], score: 0 },
    b: { pieces: [], score: 0 },
  };

  MATERIAL_ROLES.forEach((role) => {
    const leader: ShortChessColor = diff[role] > 0 ? 'w' : 'b';
    const opponent: ShortChessColor = leader === 'w' ? 'b' : 'w';
    const count = Math.abs(diff[role]);

    // uvek beli set - crne figure se ne vide na tamnoj pozadini
    for (let i = 0; i < count; i++) {
      result[leader].pieces.push(`w${role.toUpperCase()}` as PieceSan);
    }
    result[leader].score += count * MATERIAL_VALUES[role];
    result[opponent].score -= count * MATERIAL_VALUES[role];
  });

  return result;
};

type Props = MaterialAdvantageData;

export const MaterialAdvantage: React.FC<Props> = ({ pieces, score }) => {
  const { board } = useTheme();
  const { isMobile } = useIsTablet();
  const size = isMobile ? PIECE_SIZE_PX.mobile : PIECE_SIZE_PX.desktop;

  return (
    <div className="flex items-center" style={{ minHeight: size }}>
      {pieces.map((pieceSan, i) => (
        <span
          key={`${pieceSan}-${i}`}
          className="flex"
          // iste figure se preklapaju, razlicite imaju mali razmak
          style={{
            marginLeft:
              i === 0 ? 0 : pieces[i - 1] === pieceSan ? -size / 2 : 2,
          }}
        >
          {board.renderPiece({ pieceSan, squareWidth: size })}
        </span>
      ))}
      {score > 0 && (
        <span className="ml-1 text-xs md:text-sm text-slate-400 leading-none">
          +{score}
        </span>
      )}
    </div>
  );
};
