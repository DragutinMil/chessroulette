import React, { useEffect, useState } from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { invoke } from '@xmatter/util-kit';
import { BetweenGamesAborter } from './components/BetweenGamesAborter';
import { Button } from '../../../../components/Button/Button';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
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
import { useGame } from '@app/modules/Game/hooks';

type Props = PlayDialogContainerContainerProps;

export const MatchStateDialogContainer: React.FC<Props> = (
  gameStateDialogProps
) => {
  const { match, ...matchView } = useMatchViewState();
  const [fromWeb, setFromWeb] = useState(false)
  const [fromApp, setFromApp] = useState(false)
  
  const dispatch = useMatchActionsDispatch();
  const router = useRouter();
  const { lastOffer, playerId } = useGame();

  useEffect(() => {
    if (match?.status === 'complete') {
      const parts = window.location.pathname.split('/');
      const match_id = parts[parts.length - 1];
      const sendResults = async () => {
        try {
          const response = await fetch(
            process.env.NEXT_PUBLIC_API_WEB + 'fetch_roulette_match_result',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                match_id: match_id, //match_id
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }

          const data = await response.json();
          //  console.log('data', data);
        } catch (error) {
          console.error('Fetch error', error);
        }
      };

      sendResults();
    }
  }, [match?.winner]);
  // useEffect(() => {
  //   console.log('lastOffer provera', lastOffer);
    
  // }, [lastOffer]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const userId = url.searchParams.get('userId');

    function parseJwt(token: string) {
      try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = Buffer.from(base64, 'base64').toString('utf-8');
        return JSON.parse(json);
      } catch (e) {
        console.error('Invalid token', e);
        return null;
      }
    }
    //SA APA IDE PROVERA
    if (url.searchParams.get('sessionToken')) {
      setFromApp(true)
      console.log('App');
      const token = url.searchParams.get('sessionToken');
      const data = parseJwt(token || '');
      console.log('token data app', data);
      if (data?.userId !== userId) {
        if (match) {
         
          console.log('out');
          // router.push("https://chess.outpostchess.com/room/a/match/ilegal&theme=op")
        }
      }
    }
    //SA WEB IDE PROVERA
    else  {
      console.log('in web');
     
      const token: string | undefined = Cookies.get('sessionToken');
      const data = parseJwt(token || '');
      if(data?.user_id.length>0){
        setFromWeb(true)
        console.log('web');
      }
      //console.log('token data web', data);
      if (data?.user_id !== userId) {
        console.log('out', userId, data?.user_id);
        // router.push('https://app.outpostchess.com/online-list');
      }
    }
  }, []);

  if (match?.status === 'aborted' ) {
    return (
    

    
      <Dialog
        title="Match Aborted"
        content={
          <>
            {/* { (document.referrer.includes('app.outpostchess.com') || document.referrer.includes('localhost:8080') || document.referrer.includes('test-app.outpostchess.com')) && */}
            {  fromWeb && (
            <Button
              icon="ArrowLeftIcon"
              bgColor="yellow"
              style={{ marginTop: 12 }}
              onClick={() => {
                router.push('https://app.outpostchess.com/online-list');
              }}
            >
              Lobby &nbsp;&nbsp;&nbsp;&nbsp;
            </Button>

            )}
          </>
        } // should there be something?
      />
    );
  }

  // TODO: Here we should just check the match.status

  if (match?.winner && !lastOffer) {
    return (
      <Dialog
        title="Match Completed"
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex  justify-center content-center text-center flex-col">
              <Text>
                {match[match.winner].id.length == 16 ? (
                  <span className="capitalize">
                    Bot
                    {` `}Won{` `}
                    <span>🏆</span>
                  </span>
                ) : (
                  // REGULAR NAME
                  <span className="capitalize">
                    {match[match.winner].displayName || match[match.winner].id}
                    {` `}Won{` `}
                    <span>🏆</span>
                  </span>
                )}
              </Text>
              {match[match.winner].id.length !== 16 &&  (
                <div className="justify-center items-center flex flex-col">
                  {match.challengee.id=='8UWCweKl1Gvoi'  && (
                    <Button
                    icon="ArrowPathRoundedSquareIcon"
                    style={{
                      marginTop: 18,
                      background: '#07da63',
                      color: '#202122',
                    }}
                    onClick={() => {
                      if (playerId) {
                        dispatch({
                          type: 'play:sendOffer',
                          payload: {
                            byPlayer: playerId, //gameStateDialogProps.playerId,
                            offerType: 'rematch',
                          },
                        });
                      }
                    }}
                  >
                    Rematch
                  </Button>

                  )}
                  
                  {/* { (document.referrer.includes('app.outpostchess.com') || document.referrer.includes('localhost:8080') || document.referrer.includes('test-app.outpostchess.com')) && */}
                 {fromWeb && (
                      <Button
                      icon="ArrowLeftIcon"
                      bgColor="yellow"
                      style={{ marginTop: 12 }}
                      onClick={() => {
                        router.push('https://app.outpostchess.com/online-list');
                      }}
                      >
                      Lobby &nbsp;&nbsp;&nbsp;&nbsp;
                      </Button>

                 )}
                 

                  {/* } */}
                </div>
              )}
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
