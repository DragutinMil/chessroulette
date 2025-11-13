import { MovexReducer } from 'movex-core-util';
import { invoke, swapColor, isOneOf, GameOverReason, ChessRouler } from '@xmatter/util-kit';
import * as PlayStore from '@app/modules/Match/Play/store';
import { AbandonedGame, AbortedGame, CompletedGame, Game, GameStateWinner, IdlingGame, OngoingGame } from '@app/modules/Game';
import { MatchActions, MatchState } from './types';
import { initialMatchState } from './state';
import { getMatchPlayerRoleById } from './util';
import { GameOffer } from '@app/modules/Game';
import { ChatMessage } from './types';
import { UserId } from '@app/modules/User';

export const calculateOfferCounters = (
  match: NonNullable<MatchState>
): { takeback: Record<UserId, number>; draw: Record<UserId, number> } => {
  const { challenger, challengee } = match;
  const playerIds = [challenger.id, challengee.id];

  const takeback: Record<UserId, number> = {
    [challenger.id]: 0,
    [challengee.id]: 0,
  };
  const draw: Record<UserId, number> = {
    [challenger.id]: 0,
    [challengee.id]: 0,
  };

  // Count offers from current game
  if (match.gameInPlay?.offers) {
    match.gameInPlay.offers.forEach((offer) => {
      if (offer.type === 'takeback' && playerIds.includes(offer.byPlayer)) {
        takeback[offer.byPlayer] = (takeback[offer.byPlayer] || 0) + 1;
      }
      if (offer.type === 'draw' && playerIds.includes(offer.byPlayer)) {
        draw[offer.byPlayer] = (draw[offer.byPlayer] || 0) + 1;
      }
    });
  }
  return { takeback, draw };
};

const ensureOfferCounters = (match: NonNullable<MatchState>) => {
  return {
    ...match,
    offerCounters: calculateOfferCounters(match),
  };
};

export const reducer: MovexReducer<MatchState, MatchActions> = (
  prev: MatchState = initialMatchState,
  action: MatchActions
): MatchState => {
  // console.log('prev',prev)

  // console.log('action match',action)

  if (!prev) {
    return prev;
  }
  // console.log('prev movex',prev)
  const prevMatch = ensureOfferCounters(prev);

  if (action.type === 'play:sendOffer') {
    const { byPlayer, offerType } = action.payload;

    if (offerType === 'rematch') {
      const newArray = prev.endedGames.slice(0, -1);
      const nextOffers: GameOffer[] = [
        {
          byPlayer,
          type: offerType,
          status: 'pending',
          ...(action.payload.timestamp && {
            timestamp: action.payload.timestamp,
          }),
        },
      ];
      return {
        ...prev,
        endedGames: [
          ...newArray,
          {
            ...prev.endedGames[prev.endedGames.length - 1],
            offers: nextOffers,
          },
        ],
      };
    }

    const offerCounters = calculateOfferCounters(prevMatch);

    if (offerType === 'takeback') {
      const current = offerCounters.takeback[byPlayer] ?? 0;
      if (current >= 1) {
        return prev;
      }
    }

    if (offerType === 'draw') {
      const current = offerCounters.draw[byPlayer] ?? 0;
      if (current >= 3) {
        return prev;
      }
    }
  }

  // answer to offers on completed games
  if (
    isOneOf(action.type, ['play:denyOffer', 'play:cancelOffer']) &&
    prevMatch.gameInPlay == null
  ) {
    if (
      prev.endedGames.length === 0 ||
      !prev.endedGames[0].offers ||
      prev.endedGames[0].offers.length === 0
    ) {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.endedGames[0].offers[prev.endedGames[0].offers.length - 1],
      status: action.type === 'play:denyOffer' ? 'denied' : 'cancelled',
    };

    const nextOffers = [...prev.endedGames[0].offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      endedGames: [
        {
          ...prev.endedGames[0],
          offers: nextOffers,
        },
        ...prev.endedGames.slice(1),
      ],
    };
  }

  if (action.type === 'play:acceptOfferRematch') {
    const { target_url } = action.payload;
    const { initiator_url } = action.payload;
    const lastIndex = prev.endedGames.length - 1;
    const lastGame = prev.endedGames[lastIndex];

    const lastOffer: GameOffer = {
      ...prev.endedGames[0].offers[prev.endedGames[0].offers.length - 1],
      status: 'accepted',
      linkInitiator: initiator_url,
      linkTarget: target_url,
    };
    // console.log('lastOffer', lastOffer);

    const nextOffers = [...lastGame.offers.slice(0, -1), lastOffer];
    const updatedLastGame = {
      ...lastGame,
      offers: nextOffers,
    };
    const updatedEndedGames = [
      ...prev.endedGames.slice(0, lastIndex),
      updatedLastGame,
    ];
    // console.log('updatedEndedGames', updatedEndedGames);

    return {
      ...prev,
      endedGames: updatedEndedGames,
    };
  }

  if (action.type === 'play:sendMessage') {
    const newMessage: ChatMessage = {
      senderId: action.payload.senderId,
      content: action.payload.content,
      timestamp: action.payload.timestamp,
    };

    return {
      ...prev,
      messages: [...(prev.messages || []), newMessage], // <-- Dodajte || [] kao fallback
    };
  }

  if (action.type === 'play:updateChatState') {
    const { userId, isChatEnabled } = action.payload;

    // Only update if the state would actually change
    const player =
      prev.challenger.id === userId ? prev.challenger : prev.challengee;
    if (player.isChatEnabled === isChatEnabled) {
      return prev; // No change needed
    }

    return {
      ...prev,
      challenger:
        prev.challenger.id === userId
          ? { ...prev.challenger, isChatEnabled }
          : prev.challenger,
      challengee:
        prev.challengee.id === userId
          ? { ...prev.challengee, isChatEnabled }
          : prev.challengee,
    };
  }

  //OFFER REMATCH - here to effect completed matches
  if (action.type === 'play:sendOffer') {
    //  console.log('rematch', prev);
    const { byPlayer, offerType } = action.payload;

    if (offerType == 'rematch') {
      const newArray = prev.endedGames.slice(0, -1);
      const nextOffers: GameOffer[] = [
        {
          byPlayer,
          type: offerType,
          status: 'pending',
          ...(action.payload.timestamp && {
            timestamp: action.payload.timestamp,
          }),
        },
      ];
      return {
        ...prev,
        endedGames: [
          ...newArray,
          {
            ...prev.endedGames[prev.endedGames.length - 1],
            offers: nextOffers,
          },
        ],
      };
    }
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

  if (action.type === 'play:resumeAbandonedGame') {
    const abandonedGame = prev.gameInPlay as AbandonedGame;
    
    if (!abandonedGame || abandonedGame.status !== 'abandoned') {
      return prev;
    }
    
    // Proveri da li igra ima dovoljno poteza da bi bila ongoing
    // Igra prelazi iz idling u ongoing kada oba igrača naprave prvi potez (moveNumber >= 2)
    const chessRouler = new ChessRouler({ pgn: abandonedGame.pgn });
    const moveNumber = chessRouler.moveNumber();
    const wasOngoing = moveNumber >= 2;
    
    // Destructure da uklonimo abandoned polja
    const { abandonedAt, abandonedBy, ...gameWithoutAbandonedFields } = abandonedGame;
    
    // Vrati igru u prethodni status sa ispravnim timeLeft.lastUpdatedAt
    if (wasOngoing) {
      const resumedGame: OngoingGame = {
        ...gameWithoutAbandonedFields,
        status: 'ongoing',
        timeLeft: {
          ...abandonedGame.timeLeft,
          lastUpdatedAt: abandonedGame.lastMoveAt, // Ongoing igra ima lastUpdatedAt = lastMoveAt
        },
      };
      
      return {
        ...prev,
        gameInPlay: resumedGame,
      };
    } else {
      const resumedGame: IdlingGame = {
        ...gameWithoutAbandonedFields,
        status: 'idling',
        timeLeft: {
          ...abandonedGame.timeLeft,
          lastUpdatedAt: null, // Idling igra ima lastUpdatedAt = null
        },
      };
      
      return {
        ...prev,
        gameInPlay: resumedGame,
      };
    }
  }

  //if (!prevMatch.gameInPlay && prevMatch.endedGames !== undefined) {
  //  if (prevMatch.endedGames !== undefined) {
  //    var prevEndedGame = prevMatch.endedGames[prevMatch.endedGames.length - 1];
  //    const nextEndedGame = PlayStore.reducer(prevEndedGame, action);
  //  }
  //}

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

  if (nextOngoingGame.status === 'abandoned') {
    // Keep the game in play state, it will be completed after countdown
    // But only if match is not already complete
    if (prevMatch.status === 'complete') {
      return prev;
    }
    
    return {
      ...prev,
      gameInPlay: nextOngoingGame,
    };
  }

  if (nextOngoingGame.status === 'complete') {
    // Check if it was completed from abandoned state
    if (nextOngoingGame.gameOverReason === GameOverReason['abandoned']) {
      const abandonedCurrentPlay = nextOngoingGame;
      
      // Similar to aborted game logic
      const nextMatchState = invoke(
        (): Pick<NonNullable<MatchState>, 'winner' | 'status'> => {
          // Proveri da li je winner validan ChessColor (ne '1/2')
          if (nextOngoingGame.winner === '1/2') {
            // Ako je draw, match ostaje ongoing ili complete (zavisi od prethodnog stanja)
            return {
              status: prevMatch.status === 'complete' ? 'complete' : 'ongoing',
              winner: prevMatch.winner,
            };
          }
          
          return prevMatch.endedGames.length === 0
            ? {
                status: 'complete',
                winner: getMatchPlayerRoleById(
                  prevMatch,
                  nextOngoingGame.players[nextOngoingGame.winner]
                ),
              }
            : {
                status: prevMatch.status === 'complete' ? 'complete' : 'ongoing',
                winner: prevMatch.winner || getMatchPlayerRoleById(
                  prevMatch,
                  nextOngoingGame.players[nextOngoingGame.winner]
                ),
              };
        }
      );

      return {
        ...prev,
        endedGames: [...prevMatch.endedGames, abandonedCurrentPlay],
        gameInPlay: null,
        ...nextMatchState,
      };
    }
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
  // console.log(prev);
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
  if (!state) {
    return state;
  }
  // console.log('state 1 transformSta', state);
  if (state.status === 'complete' || state.status === 'aborted') {
    // console.log('state 1 transformSta', state);
    return state;
  }
  const ongoingPlay = state.gameInPlay;

  if (ongoingPlay?.status === 'ongoing') {
    const turn = swapColor(ongoingPlay.lastMoveBy);

    const timeSince =
      masterContext.requestAt - ongoingPlay.timeLeft.lastUpdatedAt;

    if (timeSince > 100) {
      const nextTimeLeft = PlayStore.calculateTimeLeftAt({
        at: masterContext.requestAt,
        turn,
        prevTimeLeft: ongoingPlay.timeLeft,
        timeClass: ongoingPlay.timeClass, // Add timeClass
        isMove: false, // This is not a move, just a time update
      });

      return {
        ...state,
        gameInPlay: {
          ...ongoingPlay,
          timeLeft: nextTimeLeft,
        },
      };
    }

    return state;
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

if (ongoingPlay?.status === 'abandoned') {
  const abandonedGame = ongoingPlay as AbandonedGame;
  const timeSinceAbandoned = masterContext.requestAt - abandonedGame.abandonedAt;
  const ABANDON_TIMEOUT_MS = 30000; // 30 seconds

  if (timeSinceAbandoned >= ABANDON_TIMEOUT_MS) {
    // Auto-complete the game with remaining player as winner
    const winnerColor = swapColor(abandonedGame.abandonedBy);
    const completedGame: CompletedGame = {
      ...abandonedGame,
      status: 'complete',
      winner: winnerColor,
      gameOverReason: GameOverReason['abandoned'],
    };

    const nextMatchState = invoke(
      (): Pick<NonNullable<MatchState>, 'winner' | 'status'> => {
        if (state.endedGames.length === 0) {
          return {
            status: 'complete',
            winner: getMatchPlayerRoleById(
              state,
              completedGame.players[winnerColor]
            ),
          };
        }
        return {
          status: state.status === 'complete' ? 'complete' : 'ongoing',
          winner: state.winner || getMatchPlayerRoleById(
            state,
            completedGame.players[winnerColor]
          ),
        };
      }
    );

    return {
      ...state,
      endedGames: [...state.endedGames, completedGame],
      gameInPlay: null,
      ...nextMatchState,
    };
  }
}

return state;
}