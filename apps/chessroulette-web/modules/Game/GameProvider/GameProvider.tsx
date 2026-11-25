import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { FBHIndex } from '@xmatter/util-kit';

import { GameContext, GameContextProps } from './GameContext';
import { UserId, UsersMap } from '@app/modules/User';
import { Game } from '../types';
import { getGameDisplayState, getTurnFromPgn } from '../lib';
type Props = PropsWithChildren & {
  game: Game;
  playerId: UserId;
  players?: UsersMap;
} & {
  focusedIndex?: FBHIndex;
};

type Refocus = {
  game: Game;
  focusedIndex?: FBHIndex;
  index: FBHIndex;
};

export const GameProvider = ({
  game,
  focusedIndex,
  playerId,
  players,
  children,
}: Props) => {
  // refocus vazi dok se game ne promeni - isto kao ranije kad ga je efekat resetovao
  const [refocus, setRefocus] = useState<Refocus>();

  const displayIndex =
    refocus && refocus.game === game && refocus.focusedIndex === focusedIndex
      ? refocus.index
      : focusedIndex;

  const onRefocus = useCallback(
    (index: FBHIndex) => setRefocus({ game, focusedIndex, index }),
    [game, focusedIndex]
  );

  // sinhrono iz props-a - ranije je useEffect + setState davao jedan render sa starim fen-om
  const state = useMemo<GameContextProps>(
    () => ({
      committedState: {
        turn: getTurnFromPgn(game.pgn),
        game,
      },
      displayState: getGameDisplayState({
        pgn: game.pgn,
        focusedIndex: displayIndex,
      }),
      actions: { onRefocus },
      players,
      playerId,
      lastOffer: game.offers?.slice(-1)[0],
    }),
    [game, displayIndex, onRefocus, players, playerId]
  );

  return <GameContext.Provider value={state} children={children} />;
};
