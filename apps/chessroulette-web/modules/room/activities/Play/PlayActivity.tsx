import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { FBHIndex, noop, objectKeys, swapColor } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { DesktopRoomLayout } from '../../components/DesktopRoomLayout';
import { RIGHT_SIDE_SIZE_PX } from '../Learn/components/LearnBoard';
import { CameraPanel } from '../../components/CameraPanel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { PlayActivityState } from './movex';
import { usePlayActivitySettings } from './usePlayActivitySettings';
import { GameStateWidget } from './components/GameStateWidget/GameStateWidget';
import { GameActionsProvider } from './providers/GameActionsProvider';
import { GameActions } from './components/GameActions/GameActions';
import { GameStateDialog } from './components/GameStateDialog/GameStateDialog';
import { Playboard } from 'apps/chessroulette-web/components/Boards';
import { getDisplayStateFromPgn } from '../Meetup/utils';
import { FreeBoardNotation } from 'apps/chessroulette-web/components/FreeBoardNotation';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  players?: UsersMap;
  remoteState: PlayActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    typeof movexConfig['resources'],
    'room'
  >['dispatch'];
};

export const PlayActivity = ({
  remoteState,
  userId,
  players,
  roomId,
  iceServers,
  dispatch: optionalDispatch,
}: Props) => {
  const activitySettings = usePlayActivitySettings();
  const dispatch = optionalDispatch || noop;
  const { game } = remoteState;

  const [displayState, setDisplayState] = useState(
    getDisplayStateFromPgn(game.pgn)
  );

  const orientation = useMemo(
    () =>
      activitySettings.isBoardFlipped
        ? swapColor(game.orientation)
        : game.orientation,
    [activitySettings.isBoardFlipped, game.orientation]
  );

  const [canPlayGame, setCanPlayGame] = useState(false);

  useEffect(() => {
    if (
      !canPlayGame &&
      players &&
      objectKeys(players).length === 2 &&
      game.state !== 'complete'
    ) {
      setCanPlayGame(true);
    }
  }, [players]);

  useEffect(() => {
    if (game.state === 'complete' && canPlayGame) {
      setCanPlayGame(false);
    }
    if (
      game.state === 'pending' &&
      objectKeys(players || {}).length === 2 &&
      !canPlayGame
    ) {
      setCanPlayGame(true);
    }
  }, [game.state]);

  useEffect(() => {
    setDisplayState(getDisplayStateFromPgn(game.pgn));
  }, [game.pgn]);

  const onRefocus = useCallback(
    (i: FBHIndex) => setDisplayState(getDisplayStateFromPgn(game.pgn, i)),
    [game.pgn, setDisplayState]
  );

  return (
    <GameActionsProvider
      remoteState={remoteState}
      players={players}
      clientUserId={userId}
    >
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
                roomId={roomId}
                onRematchRequest={() => {
                  dispatch({
                    type: 'play:sendOffer',
                    payload: { byPlayer: userId, offerType: 'rematch' },
                  });
                }}
                onAcceptOffer={({ offer }) => {
                  if (offer === 'draw') {
                    dispatch({
                      type: 'play:acceptOfferDraw',
                    });
                  }
                  if (offer === 'rematch') {
                    dispatch({
                      type: 'play:acceptOfferRematch',
                    });
                  }
                  if (offer === 'takeback') {
                    dispatch({
                      type: 'play:acceptTakeBack',
                    });
                  }
                }}
                //TODO - at the moment nothing happens, later can decide if extra notifications when offer is cancelled
                onCancelOffer={() => {
                  dispatch({
                    type: 'play:cancelOffer',
                  });
                }}
                onDenyOffer={() => {
                  dispatch({
                    type: 'play:denyOffer',
                  });
                }}
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
                  players={players}
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
                    orientation={orientation}
                    whoAmI={userId}
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
                gameType={remoteState.gameType}
                id={roomId}
                key={`${roomId}`}
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
