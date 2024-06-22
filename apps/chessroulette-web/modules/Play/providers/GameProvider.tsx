import { PropsWithChildren, useEffect, useState } from 'react';
import {
  GameContext,
  GameContextProps,
  initialGameContextState,
} from './GameContext';
import { FBHIndex } from '@xmatter/util-kit';
import { getGameDisplayState, getGameTurn } from '../lib';
import { Game } from '../store';
import { UserId, UsersMap } from '../../user';

type Props = PropsWithChildren & {
  game: Game;
  playerId: UserId;
  players?: UsersMap;
} & {
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
    players: props.players,
    playerId: props.playerId,
  });

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      lastOffer: props.game.offers?.slice(-1)[0],
    }));
  }, [props.game.offers]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
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
    }));
  }, [props.game.pgn, props.focusedIndex, props.game.winner]);

  return (
    <GameContext.Provider value={state}>{props.children}</GameContext.Provider>
  );
};
