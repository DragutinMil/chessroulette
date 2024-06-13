import { DispatchOf, FBHIndex, objectKeys, swapColor } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { GameStateWidget } from './components/GameStateWidget/GameStateWidget';
import { GameActionsProvider } from './providers/GameActionsProvider';
import { GameActions } from './components/GameActions/GameActions';
import { GameStateDialog } from './components/GameStateDialog/GameStateDialog';
import { Playboard } from 'apps/chessroulette-web/components/Boards';
import { FreeBoardNotation } from 'apps/chessroulette-web/components/FreeBoardNotation';
import { getDisplayStateFromPgn } from '../room/activities/Meetup/utils';
import { DesktopRoomLayout } from '../room/components/DesktopRoomLayout';
import { RIGHT_SIDE_SIZE_PX } from '../room/activities/Learn/components/LearnBoard';
import { CameraPanel } from '../room/components/CameraPanel';
import { PlayActions, PlayState } from './store';

export type Props = {
  state: PlayState;
  dispatch: DispatchOf<PlayActions>;
  roomId: string;
  userId: UserId;
  players?: UsersMap;
  isBoardFlipped?: boolean;

  // TODO: @deprecate this from here in favor of providing it in context that the camera panel access by itself
  iceServers: IceServerRecord[];
};

export const PlayContainer = ({
  state,
  dispatch,
  roomId,
  userId,
  iceServers,
  isBoardFlipped,
  players,
}: Props) => {
  const { game } = state;

  const [displayState, setDisplayState] = useState(
    getDisplayStateFromPgn(game.pgn)
  );

  const orientation = useMemo(
    () => (isBoardFlipped ? swapColor(game.orientation) : game.orientation),
    [isBoardFlipped, game.orientation]
  );

  const [canPlayGame, setCanPlayGame] = useState(false);

  // useEffect(() => {
  //   console.log('[PlayContainer] remote state changeed', state);
  // }, [state]);

  // useEffect(() => {
  //   console.log('[PlayContainer] players changeed', players);
  // }, [players]);

  // useEffect(() => {
  //   console.log('[PlayContainer] canPlayGame changeed', canPlayGame);
  // }, [canPlayGame]);

  useEffect(() => {
    if (
      !canPlayGame &&
      players &&
      objectKeys(players).length === 2 &&
      game.status !== 'complete'
    ) {
      setCanPlayGame(true);
    }
  }, [players]);

  useEffect(() => {
    if (game.status === 'complete' && canPlayGame) {
      setCanPlayGame(false);
    }
    if (
      game.status === 'pending' &&
      objectKeys(players || {}).length === 2 &&
      !canPlayGame
    ) {
      setCanPlayGame(true);
    }
  }, [game.status]);

  useEffect(() => {
    setDisplayState(getDisplayStateFromPgn(game.pgn));
  }, [game.pgn]);

  const onRefocus = useCallback(
    (i: FBHIndex) => setDisplayState(getDisplayStateFromPgn(game.pgn, i)),
    [game.pgn, setDisplayState]
  );

  return (
    <GameActionsProvider game={state.game} players={players} playerId={userId}>
      <DesktopRoomLayout
        rightSideSize={RIGHT_SIDE_SIZE_PX}
        mainComponent={({ boardSize }) => (
          <Playboard
            sizePx={boardSize}
            fen={displayState.fen}
            lastMove={displayState.lastMove}
            canPlay={canPlayGame}
            overlayComponent={
              <GameStateDialog
                // roomId={roomId}
                onRematchRequest={() => {
                  dispatch({
                    type: 'play:sendOffer',
                    payload: { byPlayer: userId, offerType: 'rematch' },
                  });
                }}
                onAcceptOffer={({ offer }) => {
                  if (offer === 'draw') {
                    dispatch({ type: 'play:acceptOfferDraw' });
                  } else if (offer === 'rematch') {
                    dispatch({ type: 'play:acceptOfferRematch' });
                  } else if (offer === 'takeback') {
                    dispatch({ type: 'play:acceptTakeBack' });
                  }
                }}
                //TODO - at the moment nothing happens, later can decide if extra notifications when offer is cancelled
                onCancelOffer={() => dispatch({ type: 'play:cancelOffer' })}
                onDenyOffer={() => dispatch({ type: 'play:denyOffer' })}
              />
            }
            playingColor={orientation}
            onMove={(payload) => {
              dispatch({
                type: 'play:move',
                payload: {
                  ...payload,
                  moveAt: new Date().getTime(),
                },
              });

              // TODO: This can be returned from a more internal component
              return true;
            }}
            rightSideSizePx={RIGHT_SIDE_SIZE_PX}
            rightSideClassName="flex flex-col"
            rightSideComponent={
              <>
                <div className="flex-1" />
                <div className="relative flex flex-col items-center justify-center">
                  <PanelResizeHandle
                    className="w-1 h-20 rounded-lg bg-slate-600"
                    title="Resize"
                  />
                </div>
                <div className="flex-1" />
              </>
            }
          />
        )}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {players && players[userId] && (
              <div className="overflow-hidden rounded-lg shadow-2xl">
                {/* // This needs to show only when the user is a players //
                  otherwise it's too soon and won't connect to the Peers */}
                <CameraPanel
                  participants={players}
                  userId={userId}
                  peerGroupId={roomId}
                  iceServers={iceServers}
                  aspectRatio={16 / 9}
                />
              </div>
            )}
            <div className="flex flex-row w-full">
              {canPlayGame && (
                <div>
                  <GameActions
                    homeColor={orientation}
                    playerId={userId}
                    onOfferDraw={() => {
                      dispatch({
                        type: 'play:sendOffer',
                        payload: { byPlayer: userId, offerType: 'draw' },
                      });
                    }}
                    onTakeback={() => {
                      dispatch({
                        type: 'play:sendOffer',
                        payload: {
                          byPlayer: userId,
                          offerType: 'takeback',
                          timestamp: new Date().getTime(),
                        },
                      });
                    }}
                    onResign={() => {
                      dispatch({
                        type: 'play:resignGame',
                        payload: { color: orientation },
                      });
                    }}
                    buttonOrientation="vertical"
                  />
                </div>
              )}
              <div className="flex-1" />
              <GameStateWidget
                game={game}
                id={roomId}
                key={roomId}
                onTimerFinished={() => {
                  dispatch({
                    type: 'play:timeout',
                  });
                }}
              />
            </div>
            <div className="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl">
              <FreeBoardNotation
                history={displayState.history}
                focusedIndex={displayState.focusedIndex}
                onDelete={() => {}}
                onRefocus={onRefocus}
              />
            </div>
          </div>
        }
      />
    </GameActionsProvider>
  );
};
