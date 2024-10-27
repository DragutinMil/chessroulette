import { useCallback, useEffect, useMemo, useState } from 'react';
import movexConfig from '@app/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { FBHIndex, noop, swapColor, toShortColor } from '@xmatter/util-kit';
import { Playboard } from '@app/components/Boards';
import { StartPositionIconButton } from '@app/components/Chessboard';
import { FreeBoardNotation } from '@app/components/FreeBoardNotation';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { IceServerRecord } from '@app/modules/PeerToPeer/PeerToPeerProvider';
import { UserId, UsersMap } from '@app/modules/User';
// import { getGameDisplayState } from '@app/modules/Play';
import { GameDisplayView } from '@app/modules/Meetup';
import { PeerToPeerCameraWidget } from '../../../PeerToPeer/PeerToPeerCameraWidget';
import { RIGHT_SIDE_SIZE_PX } from '../../CONSTANTS';
import { MeetupActivityState } from './movex';
import { useMeetupActivitySettings } from './useMeetupActivitySettings';
import { getGameDisplayState } from '@app/modules/Game/lib';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants: UsersMap;
  remoteState: MeetupActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const MeetupActivity = ({
  remoteState,
  userId,
  participants,
  roomId,
  iceServers,
  dispatch: optionalDispatch,
}: Props) => {
  const activitySettings = useMeetupActivitySettings();
  const dispatch = optionalDispatch || noop;
  const { game } = remoteState;

  const [displayState, setDisplayState] = useState(getGameDisplayState(game));

  const orientation = useMemo(
    () =>
      toShortColor(
        activitySettings.isBoardFlipped
          ? swapColor(game.orientation)
          : game.orientation
      ),
    [activitySettings.isBoardFlipped, game.orientation]
  );

  useEffect(() => {
    // Reset it when the pgn updates from outside
    setDisplayState(getGameDisplayState(game));
  }, [game.pgn]);

  const onRefocus = useCallback(
    (i: FBHIndex) =>
      setDisplayState(getGameDisplayState({ pgn: game.pgn, focusedIndex: i })),
    [game.pgn, setDisplayState]
  );

  return (
    <ResizableDesktopLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <Playboard
          canPlay
          turn={displayState.turn}
          sizePx={boardSize}
          fen={displayState.fen}
          playingColor={orientation}
          lastMove={displayState.lastMove}
          onMove={(payload) => {
            dispatch({
              type: 'meetup:move',
              payload,
            });

            // TODO: This can be returned from a more internal component
            return true;
          }}
          rightSideSizePx={RIGHT_SIDE_SIZE_PX}
          rightSideClassName="flex flex-col"
          rightSideComponent={
            <>
              <div className="flex-1">
                {activitySettings.canResetBoard && (
                  <StartPositionIconButton
                    className="mb-2"
                    onClick={() => {
                      dispatch({ type: 'meetup:startNewGame' });
                    }}
                  />
                )}
              </div>

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
          {participants && participants[userId] && (
            <div className="overflow-hidden rounded-lg shadow-2xl">
              {/* // This needs to show only when the user is a participants //
                  otherwise it's too soon and won't connect to the Peers */}
              {/* // TODO: Is this still the case with the new movex subscribers updates? */}
              <PeerToPeerCameraWidget
                participants={participants}
                userId={userId}
                peerGroupId={roomId}
                iceServers={iceServers}
                aspectRatio={16 / 9}
              />
            </div>
          )}
          <GameDisplayView game={game} />
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
  );
};
