import { useEffect, useState } from 'react';
import {
  GameActionsProvider,
  GameActionsProviderProps,
} from './GameActionsProvider';
import {
  GameContext,
  GameContextProps,
  initialGameContextState,
} from './GameContext';
import { FBHIndex } from '@xmatter/util-kit';
import { getGameDisplayState, getGameTurn } from '../lib';

type Props = GameActionsProviderProps & {
  focusedIndex?: FBHIndex;
};

export const GameProvider = (props: Props) => {
  const [state, setState] = useState<GameContextProps>({
    ...initialGameContextState,
    realState: {
      turn: getGameTurn(props.game.pgn),
      game: props.game,
    },
    displayState: getGameDisplayState({
      pgn: props.game.pgn,
      focusedIndex: props.focusedIndex,
    }),
  });

  useEffect(() => {
    setState({
      actions: {
        onRefocus: (nextIndex) => {
          setState((prev) => ({
            ...prev,
            displayState: getGameDisplayState({
              pgn: props.game.pgn,
              focusedIndex: nextIndex,
            }),
          }));
        },
      },
      realState: {
        turn: getGameTurn(props.game.pgn),
        game: props.game,
      },
      displayState: getGameDisplayState({
        pgn: props.game.pgn,
        focusedIndex: props.focusedIndex,
      }),
    });
  }, [props.game.pgn, props.focusedIndex]);

  return (
    <GameContext.Provider value={state}>
      {/* // The Game Actions Provider/Context could be absorbed by this provider */}
      <GameActionsProvider {...props} />
    </GameContext.Provider>
  );
};
