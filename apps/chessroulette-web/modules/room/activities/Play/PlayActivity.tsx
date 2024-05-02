import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { noop, objectKeys, pgnToFen, swapColor } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { DesktopRoomLayout } from '../../components/DesktopRoomLayout';
import { RIGHT_SIDE_SIZE_PX } from '../Learn/components/LearnBoard';
import { Playboard } from 'apps/chessroulette-web/components/Chessboard/Playboard';
import { CameraPanel } from '../../components/CameraPanel';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { PlayActivityState } from './movex';
import { usePlayActivitySettings } from './usePlayActivitySettings';
import { GameNotation } from '../Meetup/components/GameNotation';
import { GameStateWidget } from './components/GameStateWidget/GameStateWidget';
import { GameStateDialog } from 'apps/chessroulette-web/components/Dialog/GameStateDialog';
import { GameActionsProvider } from './providers/GameActionsProvider';
import { GameActions } from './components/GameActions/GameActions';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants?: UsersMap;
  remoteState: PlayActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    typeof movexConfig['resources'],
    'room'
  >['dispatch'];
};

export const PlayActivity = ({
  remoteState,
  userId,
  participants,
  roomId,
  iceServers,
  dispatch: optionalDispatch,
}: Props) => {
  const activitySettings = usePlayActivitySettings();
  const dispatch = optionalDispatch || noop;
  const { game } = remoteState;

  const [gameFinished, setGameFinished] = useState(false);

  const canPlay = useRef(false);

  //TODO - remove this, improve logic
  const [_, rerender] = useReducer((s) => s + 1, 0);

  const [fen, setFen] = useState(pgnToFen(game.pgn));
  const orientation = useMemo(
    () =>
      activitySettings.isBoardFlipped
        ? swapColor(game.orientation)
        : game.orientation,
    [activitySettings.isBoardFlipped, game.orientation]
  );

  useEffect(() => {
    //TODO - improve logic here, to messy
    if (!canPlay.current) {
      if (participants && objectKeys(participants).length > 1) {
        canPlay.current = true;
        rerender();
      }
    }
  }, [participants]);

  useEffect(() => {
    if (game.state === 'complete') {
      if (canPlay.current) {
        //TODO - again improve logic
        canPlay.current = false;
        // rerender();
      }
      setGameFinished(true);
    }
    //TODO - improve logic, make the game state the only source of truth
    if (game.state !== 'complete' && gameFinished) {
      setGameFinished(false);
      canPlay.current = true;
    }
  }, [game.state]);

  return (
    <GameActionsProvider
      remoteState={remoteState}
      participants={participants}
      clientUserId={userId}
    >
      <DesktopRoomLayout
        rightSideSize={RIGHT_SIDE_SIZE_PX}
        mainComponent={({ boardSize }) => (
          <>
            <Playboard
              sizePx={boardSize}
              fen={fen}
              canPlay={canPlay.current}
              overlayComponent={
                <GameStateDialog
                  onRematchRequest={() => {
                    dispatch({
                      type: 'play:sendOffer',
                      payload: { byParticipant: userId, offerType: 'rematch' },
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
          </>
        )}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {participants && participants[userId] && (
              <div className="overflow-hidden rounded-lg shadow-2xl">
                {/* // This needs to show only when the user is a participants //
                  otherwise it's too soon and won't connect to the Peers */}
                <CameraPanel
                  participants={participants}
                  userId={userId}
                  peerGroupId={roomId}
                  iceServers={iceServers}
                  aspectRatio={16 / 9}
                />
              </div>
            )}
            <div className="flex flex-row w-full">
              <div className="flex-1">
                <GameActions
                  orientation={orientation}
                  onOfferDraw={() => {
                    dispatch({
                      type: 'play:sendOffer',
                      payload: { byParticipant: userId, offerType: 'draw' },
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
              <GameNotation pgn={game.pgn} onUpdateFen={setFen} />
            </div>
          </div>
        }
      />
    </GameActionsProvider>
  );
};
