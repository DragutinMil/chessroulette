import { ChessFEN } from '@xmatter/util-kit';
import { useChessEngineFromFen } from '../hooks/useChessEngine';

type Props = {
  /**
   * This can be the gameId or anything unique that doesn't change on every move
   * It's used to tell the engine to set a new game
   */
  gameId: string;
  fen: ChessFEN;
};

export type EngineState = {
  bestMove?: string;
  line?: {
    depth: number;
    score: {
      unit: string; // 'cp' | 'mate'
      value: number;
    };
    pv?: string;
    evaluation: {
      heightsPct: {
        w: number;
        b: number;
      };
      evalAsStr: string;
    };
  };
};

export const ChessEngineDisplay = ({ gameId, fen }: Props) => {
  const engine = useChessEngineFromFen(gameId, fen, { depth: 12 });

  const { bestLine, bestMove, ...engineProps } = engine;

  return (
    <div className="text-sm sbg-slate-800 srounded-lg sp-1 pb-2 spx-2 border-b border-slate-600 overflow-hidden">
      {bestLine ? (
        <>
          <p className="flex justify-between pb-2">
            <span>
              <span className="text-lg font-bold">
                {bestLine.evaluation.evalAsStr}{' '}
              </span>
              {bestMove && (
                <span>
                  <span className="font-bold">Best Move:</span> {bestMove} |{' '}
                </span>
              )}
              <span>
                <span className="font-bold">Depth:</span> {bestLine.depth}
              </span>
            </span>

            <span className="font-bold italic">{engineProps.id?.name}</span>
          </p>
          <span className="truncate overflow-hidden">{bestLine?.pv}</span>
        </>
      ) : (
        <span>Loading Engine...</span>
      )}
    </div>
  );
};
