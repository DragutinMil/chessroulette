import { PropsWithChildren, useEffect, useState, useRef } from 'react';
import { FBHIndex } from '@xmatter/util-kit';

import {
  GameContext,
  GameContextProps,
  initialGameContextState,
} from './GameContext';
import { GameOffer } from '@app/modules/Game';
import { UserId, UsersMap } from '@app/modules/User';
import { Game } from '../types';
import { MatchState } from '../../Match/movex';
import { getGameDisplayState, getTurnFromPgn } from '../lib';
import { useMatchViewState } from '../../Match/hooks';
import { MatchViewState } from '../../Match/types';
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
  
  const { match, userAsPlayer } = useMatchViewState();
  //console.log('MatchState',match)
  //const lockRef = useRef(false);
  useEffect(() => {
    // console.log('🟡 FULL GAME STATE:', game);
    // if(lockRef.current !== true ){
    
     console.log('ide realna promena',game.offers)
    
        setState((prev) => ({
              ...prev,
              lastOffer: game.offers?.slice(-1)[0],
            }));
     
   
    //  }
    //  if(game.status=="complete" && game?.offers[game.offers.length-1]?.type=='rematch'){
    //  lockRef.current = true;
    //   const timeoutId = setTimeout(() => {
    //     lockRef.current = false;
    //     console.log('obrisano',lockRef.current)
    //   }, 1000);
    //   return () => clearTimeout(timeoutId);

    //  }
  }, [game.offers]);

// useEffect(() => {
//    console.log('matchmatch 2',match)
//   }, [match?.rematch]);


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
              
            }
          ),
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
