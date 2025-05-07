import React ,{useEffect}from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { invoke } from '@xmatter/util-kit';
import { BetweenGamesAborter } from './components/BetweenGamesAborter';
import { Button } from '../../../../components/Button/Button';
import {
  PlayDialogContainer,
  PlayDialogContainerContainerProps,
} from '@app/modules/Match/Play/containers';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
import { getMatchPlayerRoleById } from '../../movex/util';
import { gameOverReasonsToDisplay } from './util';

type Props = PlayDialogContainerContainerProps;

export const MatchStateDialogContainer: React.FC<Props> = (
  gameStateDialogProps
) => {
  const { match, ...matchView } = useMatchViewState();
  const dispatch = useMatchActionsDispatch();

  useEffect(() => {
    if(match?.status === 'complete'){
      const parts = window.location.pathname.split('/');
      const match_id = parts[parts.length - 1]
      console.log('fetch', process.env.VUE_APP_URL)
      console.log('fetch2', process.env.NODE_ENV)
      const sendResults = async () => {
       // change Guta Dragutin
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_API_WEB+'fetch_roulette_match_result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              match_id: match_id,//match_id
              
            }),
          });
      
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
      
          const data = await response.json();
          console.log('data', data);
        } catch (error) {
          console.error('Fetch error', error);
        }
      };
      

       sendResults()
    }
    }, [match?.winner]);

  if (match?.status === 'aborted') {
    return (
      <Dialog
        title="Match Aborted"
        content={""} // should there be something?
       
      />
    );
  }
  
  // TODO: Here we should just check the match.status
  if (match?.winner) {
    return (
      <Dialog
        title="Match Completed"
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex  justify-center content-center text-center flex-col">
              <Text>
             { ( match[match.winner].id.length==16)?  (
          <span className="capitalize">
          Bot
          {` `}Won{` `}
          <span>🏆</span>
          </span>
        ):(
          // REGULAR NAME
          <span className="capitalize">
          {match[match.winner].displayName || match[match.winner].id}
          {` `}Won{` `}
          <span>🏆</span>
          </span>
        )
      }
              </Text>
              {/* { ( match[match.winner].id.length!==16) &&  (
                <Button
                     onClick={() => {
                      dispatch({
                        type: 'play:sendOffer',
                        payload: {
                          byPlayer: '8UWCweKl1Gvoi', //gameStateDialogProps.playerId,
                          offerType: 'rematch',
                        },
                      });
                     }
                    }
                    >
                     Rematch 
                    </Button>

              )} */}
              {/* {...(match.type === 'openEnded' && {
           buttons: [
             {
              children: 'Offer Rematch',
              onClick: () => {
                dispatch({
                  type: 'play:sendOffer',
                  payload: {
                    byPlayer: gameStateDialogProps.playerId,
                    offerType: 'rematch',
                  },
                });
              },
              type: 'primary',
              bgColor: 'blue',
            },
          ],
        })} */}
         
            </div>
          </div>
        }
      />
    );
  }

  // Show at the end of a game before the next game starts
  if (
    match?.status === 'ongoing' &&
    !match.gameInPlay &&
    matchView.previousGame
  ) {
    const titleSuffix =
      matchView.previousGame.winner === '1/2' ? ' in a Draw!' : '';

    const gameOverReason =
      matchView.previousGame.status === 'complete'
        ? gameOverReasonsToDisplay[matchView.previousGame.gameOverReason]
        : 'Game was aborted';

    const previousGame = matchView.previousGame;

    const renderWinnerMessage = invoke(() => {
      if (previousGame.winner === null) {
        return null;
      }

      if (previousGame.winner === '1/2') {
        return (
          <div className="flex flex-col gap-1">
            {match.type === 'bestOf' && <Text>The round will repeat!</Text>}
          </div>
        );
      }

      const winnerByRole = getMatchPlayerRoleById(
        match,
        previousGame.players[previousGame.winner]
      );

      if (!winnerByRole) {
        return null;
      }

      const playerDisplay =
        match[winnerByRole].displayName || match[winnerByRole].id;

      return <Text className="capitalize">{playerDisplay} Won!</Text>;
    });

    return (
      <Dialog
        title={
          match.type === 'bestOf'
            ? `Game ${matchView.endedGamesCount} Ended${titleSuffix}`
            : `Game Ended${titleSuffix}!`
        }
        content={
          <div className="flex flex-col gap-4 items-center">
            <div>{gameOverReason}</div>
            <div className="flex justify-center content-center text-center">
              {renderWinnerMessage}
            </div>
            {match.breakDurationMs > 0 && (
              <BetweenGamesAborter
                totalTimeAllowedMs={match.breakDurationMs}
                startedAt={now()}
                onFinished={() => {
                  dispatch({ type: 'match:startNewGame' });
                }}
                className="text-slate-500 font-italic"
              />
            )}
          </div>
        }
        // TODO: The rematch functionality needs to be at match level
        // {...(match.type === 'openEnded' && {
        //   buttons: [
        //     {
        //       children: 'Offer Rematch',
        //       onClick: () => {
        //         dispatch({
        //           type: 'play:sendOffer',
        //           payload: {
        //             byPlayer: gameStateDialogProps.playerId,
        //             offerType: 'rematch',
        //           },
        //         });
        //       },
        //       type: 'primary',
        //       bgColor: 'blue',
        //     },
        //   ],
        // })}
      />
    );
  }

  return <PlayDialogContainer {...gameStateDialogProps} />;
};
