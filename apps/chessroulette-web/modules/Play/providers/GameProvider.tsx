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
import { getDisplayStateFromPgn } from '../../room/activities/Meetup/utils';
import { FBHIndex } from '@xmatter/util-kit';

type Props = GameActionsProviderProps & {
  focusedIndex?: FBHIndex;
};

export const GameProvider = (props: Props) => {
  const [state, setState] = useState<GameContextProps>({
    ...initialGameContextState,
    displayState: getDisplayStateFromPgn(props.game.pgn, props.focusedIndex),
  });

  useEffect(() => {
    setState({
      actions: {
        onRefocus: (nextIndex) => {
          setState((prev) => ({
            ...prev,
            displayState: getDisplayStateFromPgn(props.game.pgn, nextIndex),
          }));
        },
      },
      displayState: getDisplayStateFromPgn(props.game.pgn, props.focusedIndex),
    });
  }, [props.game.pgn, props.focusedIndex]);

  return (
    <GameContext.Provider value={state}>
      {/* // The Game Actions Provider/Context could be absorbed by this provider */}
      <GameActionsProvider {...props} />
    </GameContext.Provider>
  );
};
