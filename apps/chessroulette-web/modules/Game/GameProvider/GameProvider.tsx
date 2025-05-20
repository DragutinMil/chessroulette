import { PropsWithChildren, useEffect, useState } from 'react';
import { FBHIndex } from '@xmatter/util-kit';
import {
  GameContext,
  GameContextProps,
  initialGameContextState,
} from './GameContext';
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

export const GameProvider = ({
  game,
  focusedIndex,
  playerId,
  players,
  children,
}: Props) => {
  const [state, setState] = useState<GameContextProps>({
    ...initialGameContextState,
    committedState: {
      turn: getTurnFromPgn(game.pgn),
      game: game,
    },
    displayState: getGameDisplayState({
      pgn: game.pgn,
      focusedIndex: focusedIndex,
    }),
    players,
    playerId,
  });

  useEffect(() => {
    console.log('🟡 FULL GAME STATE:', game);
    console.log('game.offers',game.offers)
    
    if(game.offers==undefined && game.status=="complete"){
      console.log()
      return
    }
    setState((prev) => ({
      ...prev,
      lastOffer: game.offers?.slice(-1)[0],
    }))
  
   
  }, [game.offers]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      actions: {
        onRefocus: (nextIndex) => {
          setState((prev) => ({
            ...prev,
            displayState: getGameDisplayState({
              pgn: game.pgn,
              focusedIndex: nextIndex,
            }),
          }));
        },
      },
      committedState: {
        turn: getTurnFromPgn(game.pgn),
        game: game,
      },
      displayState: getGameDisplayState({
        pgn: game.pgn,
        focusedIndex,
      }),
    }));
  }, [game, focusedIndex]);

  return <GameContext.Provider value={state} children={children} />;
};
