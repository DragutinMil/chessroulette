import { ChessFEN } from '@xmatter/util-kit';
import { ChessEngineProvider } from './ChessEngineProvider';
import { config } from 'apps/chessroulette-web/config';
import { ChessEngineAnalysisDisplay } from './components/ChessEngineAnalysisDisplay';

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
  if (!canAnalyze) {
    return null;
  }

  return (
    <ChessEngineProvider uciUrl={config.ENGINE_URL}>
      <ChessEngineAnalysisDisplay {...props} />
    </ChessEngineProvider>
  );
};
