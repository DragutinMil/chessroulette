import { FreeBoardNotation } from 'apps/chessroulette-web/components/FreeBoardNotation';
import { useGame } from './providers/useGame';

export const GameNotationContainer = () => {
  const { displayState, actions } = useGame();

  return (
    <FreeBoardNotation
      history={displayState.history}
      focusedIndex={displayState.focusedIndex}
      onDelete={() => {}}
      onRefocus={actions.onRefocus}
    />
  );
};
