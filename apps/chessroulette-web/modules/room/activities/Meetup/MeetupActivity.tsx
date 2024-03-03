import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { noop } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { MeetupActivityState } from './movex';
import { RoomState } from '../../movex/reducer';
import { UserId } from 'apps/chessroulette-web/modules/user/type';
import { DesktopRoomLayout } from '../../components/DesktopRoomLayout';
import { RIGHT_SIDE_SIZE_PX } from '../Learn/components/LearnBoard';
import { Playboard } from 'apps/chessroulette-web/components/Chessboard/Playboard';
import { CameraPanel } from '../../components/CameraPanel';
import { FreeBoardNotation } from 'apps/chessroulette-web/components/FreeBoardNotation';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants?: RoomState['participants'];
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
  const dispatch = optionalDispatch || noop;

  const { game } = remoteState;

  return (
    <DesktopRoomLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <Playboard
          sizePx={boardSize}
          fen={game.displayFen}
          // {...currentChapter}
          // orientation={}
          // onFlip={() => {
          //   dispatch({
          //     type: 'loadedChapter:setOrientation',
          //     payload: swapColor(currentChapter.orientation),
          //   });
          // }}
          onMove={(payload) => {
            // dispatch({ type: 'loadedChapter:addMove', payload });

            // TODO: This can be returned from a more internal component
            return true;
          }}
          onArrowsChange={(payload) => {
            // dispatch({ type: 'loadedChapter:setArrows', payload });
          }}
          onCircleDraw={(tuple) => {
            // dispatch({
            //   type: 'loadedChapter:drawCircle',
            //   payload: tuple,
            // });
          }}
          onClearCircles={() => {
            // dispatch({ type: 'loadedChapter:clearCircles' });
          }}
        />
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

          {/* {inputState.isActive ? 'active' : 'not active'} */}
          {/* {inputState.isActive ? (
            <div className="flex gap-2">
              <span className="capitalize">Editing</span>
              <span className="font-bold">
                "{inputState.chapterState.name}"
              </span>
            </div>
          ) : (
            <ChapterDisplayView chapter={currentChapter} />
          )} */}
          <div className="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl">
            <FreeBoardNotation
              history={game.notation.history}
              focusedIndex={game.notation.focusedIndex}
              onDelete={() => {}}
              onRefocus={() => {}}
            />
          </div>
        </div>
      }
    />
  );
};
