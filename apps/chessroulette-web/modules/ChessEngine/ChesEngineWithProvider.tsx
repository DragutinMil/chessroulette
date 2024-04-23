import { ChessFEN } from '@xmatter/util-kit';
import { ChessEngineProvider } from './ChessEngineProvider';
import { config } from 'apps/chessroulette-web/config';
import { ChessEngineAnalysisDisplay } from './components/ChessEngineAnalysisDisplay';
import { Switch } from 'apps/chessroulette-web/components/Switch';
import { useState } from 'react';
import { EngineResultState } from './lib/types';

type Props = {
  /**
   * This can be the gameId or anything unique that doesn't change on every move
   * It's used to tell the engine to set a new game
   */
  gameId: string;
  fen: ChessFEN;
  canAnalyze: boolean;
  onToggle: (show: boolean) => void;
};

export const ChessEngineWithProvider = ({
  canAnalyze,
  onToggle,
  ...props
}: Props) => {
  const [bestLine, setBestLine] = useState<EngineResultState['bestLine']>();

  return (
    <div>
      {/* <div className="mb-2 gap-2 flex sjustify-between wbg-red-100 justify-end"> */}
        {/* <span className="text-lg font-bold">
          {canAnalyze && bestLine?.evaluation && (
            <>{bestLine.evaluation.evalAsStr} </>
          )} */}
        {/* </span> */}
        {/* <Switch
          label="Stockfish 15"
          value={canAnalyze}
          labelPosition="left"
          onUpdate={onToggle}
        /> */}
      {/* </div> */}
      {canAnalyze && (
        <ChessEngineProvider uciUrl={config.ENGINE_URL}>
          <ChessEngineAnalysisDisplay
            {...props}
            onUpdate={(state) => {
              setBestLine(state.bestLine);
            }}
          />
        </ChessEngineProvider>
      )}
    </div>
  );
};
