import { MovexReducer } from 'movex-core-util';
import { invoke, swapColor,isOneOf } from '@xmatter/util-kit';
import * as PlayStore from '@app/modules/Match/Play/store';
import { AbortedGame } from '@app/modules/Game';
import { MatchActions, MatchState } from './types';
import { initialMatchState } from './state';
import { getMatchPlayerRoleById } from './util';
import { GameOffer } from '@app/modules/Game';
export const reducer: MovexReducer<MatchState, MatchActions> = (
  prev: MatchState = initialMatchState,
  action: MatchActions
): MatchState => {
  if (!prev) {
    console.log('prev movex',prev)
    return prev; 
  }
  //console.log('prev movex',action)
  const prevMatch = prev;
  
 
  // answer to offers on completed games
  if (isOneOf(action.type, ['play:denyOffer', 'play:cancelOffer']) && prevMatch.gameInPlay==null) {
      return {
        ...prev, 
        endedGames: [{
          ...prev.endedGames[0], 
        // Remove the last offer ß
          offers: prev.endedGames[0].offers.slice(0, -1), 
        }]
      }; 
    }
  if (action.type === 'play:acceptOfferRematch') {
      console.log('prvi prolaz') 
       const {  target_url } = action.payload;
       const {  initiator_url } = action.payload;
      const lastOffer: GameOffer = {
        ...prev.endedGames[0].offers[prev.endedGames[0].offers.length - 1],
        status: 'accepted',
        linkInitiator:initiator_url,
        linkTarget:target_url
      };
      console.log('lastOffer',lastOffer)
      // console.log('drugi prolaz last offer',lastOffer)
      // const nextOffers = [...prev.endedGames[0].offers.slice(0, -1), lastOffer];
      // console.log('nextOffers',nextOffers)
      // const firstEndedGame = prev.endedGames[prev.endedGames.length-1];
      // const pgn=firstEndedGame.pgn
      // const w=firstEndedGame.players.w
      // const b=firstEndedGame.players.b
      // const lastMoveBy=firstEndedGame.lastMoveBy
      // const timeClass = firstEndedGame.timeClass
      // const lastMoveAt=firstEndedGame.lastMoveAt
      // const startedAt=firstEndedGame.startedAt
      // const winner=firstEndedGame.winner 
      // const newArray = prev.endedGames.slice(0, -1); 
      // if( winner && lastMoveAt){
      // return {
      //   ...prev,
      //   endedGames: [
      //     ...newArray
      //     ,{
      //       gameOverReason: 5,
      //   lastMoveAt: lastMoveAt,
      //   lastMoveBy: lastMoveBy,
      //   offers: nextOffers,
      //   pgn: pgn, 
      //   players: {w: w, b: b},
      //   startedAt: startedAt,
      //   status: "complete",
      //   timeClass: timeClass,
      //   timeLeft: {lastUpdatedAt: 1746706159630, w: 600000, b: 600000},
      //   winner: winner,

      //      //  ...prev.endedGames[prev.endedGames.length-1],
      //   }]
      // };
    // }

    }

  //OFFER REMATCH - here to effect completed matches
  if (action.type === 'play:sendOffer' ) {
     const { byPlayer, offerType } = action.payload;
 
    const firstEndedGame = prev.endedGames[prev.endedGames.length-1];
    console.log('2',firstEndedGame)
   //console.log('firstEndedGame',firstEndedGame)
    if(offerType=='rematch' ){
      const pgn=firstEndedGame.pgn
      const w=firstEndedGame.players.w
      const b=firstEndedGame.players.b
      const lastMoveBy=firstEndedGame.lastMoveBy
      const lastMoveAt=firstEndedGame.lastMoveAt
      const startedAt=firstEndedGame.startedAt
      const winner=firstEndedGame.winner
      const timeClass = firstEndedGame.timeClass
      const gameOverReason= firstEndedGame.gameOverReason
      const lastUpdatedAt=firstEndedGame.timeLeft.lastUpdatedAt
      const wTime=firstEndedGame.timeLeft.w
      const bTime=firstEndedGame.timeLeft.b
      const newArray = prev.endedGames.slice(0, -1); 
          const nextOffers: GameOffer[] = [
             {
               byPlayer,
               type: offerType,
               status: 'pending'
             },
           ];
           console.log('3',nextOffers)
      if( winner && lastMoveAt && gameOverReason && lastUpdatedAt){
            return {
              ...prev,
              endedGames: [
                ...newArray
                ,{
              gameOverReason: gameOverReason,
              lastMoveAt: lastMoveAt,
              lastMoveBy: lastMoveBy,
              offers: nextOffers,
              pgn: pgn,
              players: {w: w, b: b},
              startedAt: startedAt,
              status: "complete",
              timeClass: timeClass,
              timeLeft: {lastUpdatedAt: lastUpdatedAt, w: wTime, b: bTime},
              winner: winner, 
              
              }]
            };

            

            
          //  if( firstEndedGame.winner && firstEndedGame.lastMoveAt){
          //   return {
          //     ...prev,
          //     endedGames: [
          //       ...newArray
          //       ,{
          //         ...prev.endedGames[prev.endedGames.length-1],
          //     offers: nextOffers,
          //     }]
          //   };
           }
          
    }
       // ...prev,
            // gameInPlay: {
            //   gameOverReason: null,
            //   lastMoveAt: 1746702152547,
            //   lastMoveBy: "w",
            //   offers:  nextOffers,
            //   pgn: pgn,
            //   players: {w: pla1, b: pla2},
            //   startedAt: 1746702146133,
            //   status: "idling",
            //   timeClass: "rapid",
            //   timeLeft: {lastUpdatedAt: null, w: 600000, b: 600000},
            //   winner: null,
  }
  if (action.type === 'match:startNewGame') {
    if (prevMatch.status === 'complete') {
      return prev;
    }

    const prevPlay = prevMatch.gameInPlay;

    if (!prevPlay && prevMatch.endedGames.length === 0) {
      return prev;
    }

    const newGameParams = invoke((): PlayStore.CreatePendingGameParams => {
      const prevGame = prevPlay || prevMatch.endedGames.slice(-1)[0];

      return {
        timeClass: prevGame.timeClass,
        players: {
          w: prevGame.players.b,
          b: prevGame.players.w,
        },
      };
    });

    return {
      ...prev,
      gameInPlay: PlayStore.createPendingGame(newGameParams),
    };
  }

  if (!prevMatch.gameInPlay && prevMatch.endedGames !== undefined) {
    if (prevMatch.endedGames !== undefined) {
      var prevEndedGame = prevMatch.endedGames[prevMatch.endedGames.length - 1];
      const nextEndedGame = PlayStore.reducer(prevEndedGame, action);
    }
  }

  if (!prevMatch.gameInPlay) {
    return prev;
  }

  var prevOngoingGame = prevMatch.gameInPlay;
  const nextOngoingGame = PlayStore.reducer(prevOngoingGame, action);

  if (nextOngoingGame.status === 'aborted') {
    const abortedCurrentPlay = nextOngoingGame;

    // First game abort results in aborted match. Afterwards results in completed match + winner
    const nextMatchState = invoke(
      (): Pick<NonNullable<MatchState>, 'winner' | 'status'> => {
        return prevMatch.endedGames.length === 0
          ? {
              status: 'aborted',
              winner: null,
            }
          : {
              status: 'complete',
              winner: getMatchPlayerRoleById(
                prevMatch,
                nextOngoingGame.players[nextOngoingGame.lastMoveBy]
              ),
            };
      }
    );

    return {
      ...prev,
      endedGames: [...prevMatch.endedGames, abortedCurrentPlay],
      gameInPlay: null,
      ...nextMatchState,
    };
  }

  if (nextOngoingGame.status !== 'complete') {
    const nextOngoingGameStatus = invoke(
      (): NonNullable<MatchState>['status'] => {
        if (nextOngoingGame.status === 'ongoing') {
          return 'ongoing';
        }
        return prevMatch.endedGames.length > 0 ? 'ongoing' : 'pending';
      }
    );

    return {
      ...prev,
      gameInPlay: nextOngoingGame,
      status: nextOngoingGameStatus,
      ...(nextOngoingGameStatus === 'aborted' && {
        winner: getMatchPlayerRoleById(
          prevMatch,
          nextOngoingGame.players[swapColor(nextOngoingGame.lastMoveBy)]
        ),
      }),
    };
  }

  // Current Game is complete - so Match can only be ongoing or complete.

  const prevPlayersByRole = {
    challengee: prev.challengee,
    challenger: prev.challenger,
  };

  const nextPlayersByRole: Pick<
    NonNullable<MatchState>,
    'challengee' | 'challenger'
  > = invoke(() => {
    if (nextOngoingGame.winner === '1/2') {
      return prevPlayersByRole;
    }

    const winnerByRole = getMatchPlayerRoleById(
      prev,
      nextOngoingGame.players[nextOngoingGame.winner]
    );

    if (!winnerByRole) {
      return prevPlayersByRole;
    }

    return {
      ...prevPlayersByRole,
      [winnerByRole]: {
        ...prevPlayersByRole[winnerByRole],
        points: prevPlayersByRole[winnerByRole].points + 1,
      },
    };
  });

  const winner: NonNullable<MatchState>['winner'] = invoke(() => {
    if (prevMatch.type === 'bestOf') {
      const maxRounds = Math.ceil(prevMatch.rounds / 2);

      if (nextPlayersByRole.challenger.points === maxRounds) {
        return 'challenger';
      }

      if (nextPlayersByRole.challengee.points === maxRounds) {
        return 'challengee';
      }

      return null;
    }

    // TBD how a winner is calculated for the rest of match types
    return null;
  });

  const nextMatchStatus = winner ? 'complete' : 'ongoing';
  console.log(prev)
  return {
    ...prev,
    endedGames: [...prevMatch.endedGames, nextOngoingGame],
    gameInPlay: null,
    status: nextMatchStatus,
    winner,
    ...nextPlayersByRole,
  };
};

reducer.$transformState = (state, masterContext): MatchState => {
  console.log('state transformState ',state)
  console.log('masterContext',masterContext)
  if (!state) {
    return state;
  }

  // Determine if Match is "aborted" onRead
  // if (state.status === 'complete' || state.status === 'aborted') {
  //   console.log('state 1 transformState',state)
  //   return state
  // }
  console.log('state 2 transformState',state)
  const ongoingPlay = state.gameInPlay;

  if (ongoingPlay?.status === 'ongoing') {
    const turn = swapColor(ongoingPlay.lastMoveBy);

    const nextTimeLeft = PlayStore.calculateTimeLeftAt({
      at: masterContext.requestAt, // TODO: this can take in account the lag as well
      prevTimeLeft: ongoingPlay.timeLeft,
      turn,
    });

    return {
      ...state,
      gameInPlay: {
        ...ongoingPlay,
        timeLeft: nextTimeLeft,
      },
    };
  }

  // If the ongoing game is idling & the abort time has passed
  if (
    ongoingPlay?.status === 'idling' &&
    masterContext.requestAt > ongoingPlay.startedAt + state.timeToAbortMs
  ) {
    const nextAbortedGame: AbortedGame = {
      ...ongoingPlay,
      status: 'aborted',
    };

    // First game in the match is aborted by idling too long
    // and thus the whole Match gets aborted
    if (state.status === 'pending') {
      return {
        ...state,
        status: 'aborted',
        winner: null,
        endedGames: [nextAbortedGame],
        gameInPlay: null,
      };
    }

    // A subsequent game in the match is aborted by idling too long
    // and thus the Match Gets completed with the winner the opposite player
    if (state.status === 'ongoing') {
      return {
        ...state,
        status: 'complete',
        winner: getMatchPlayerRoleById(
          state,
          ongoingPlay.players[ongoingPlay.lastMoveBy]
        ),
        endedGames: [...state.endedGames, nextAbortedGame],
        gameInPlay: null,
      };
    }
  }

  return state;
};
