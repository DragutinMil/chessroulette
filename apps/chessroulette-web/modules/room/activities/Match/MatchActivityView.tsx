import { GameProvider } from 'apps/chessroulette-web/modules/Play';
import { DesktopRoomLayout } from '../../components/DesktopRoomLayout';
import { GameNotation } from 'apps/chessroulette-web/modules/Play/GameNotation';
import { GameStateWidget } from 'apps/chessroulette-web/modules/Play/components/GameStateWidget/GameStateWidget';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { MatchActivityActions, MatchActivityState } from './movex';
import { DispatchOf } from '@xmatter/util-kit';
import { RIGHT_SIDE_SIZE_PX } from '../Learn/components/LearnBoard';
import { GameBoardContainer } from 'apps/chessroulette-web/modules/Play/GameBoardContainer';
import { CameraPanel } from '../../components/CameraPanel';

import { GameActionsContainer } from 'apps/chessroulette-web/modules/Play/components/GameActionsContainers';
import { useEffect } from 'react';

type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  state: MatchActivityState['activityState'];
  dispatch: DispatchOf<MatchActivityActions>;
  players?: UsersMap;

  // TODO: deprecate once I have a better system for determingin player colors
  isBoardFlipped?: boolean;
};

export const MatchActivityView = ({
  state,
  userId,
  iceServers,
  dispatch,
  roomId,
  players,
  isBoardFlipped,
}: Props) => {
  // TODO: This should be part of the game Provider
  // const canPlay = useCanPlay(state.game, players);
  // useEffect(() => {
  //   setTimeout(() => {
  //     console.log('dispatching now', dispatch);
  //     dispatch({ type: 'play:cancelOffer' });
  //   }, 2 * 1000);
  // }, [dispatch]);

  return (
    <GameProvider state={state} players={players} playerId={userId}>
      <DesktopRoomLayout
        rightSideSize={RIGHT_SIDE_SIZE_PX}
        mainComponent={({ boardSize }) => (
          <GameBoardContainer
            boardSizePx={boardSize}
            isBoardFlipped={isBoardFlipped}
            // TODO: All of these can be provided from the GamePovider
            game={state.game}
            dispatch={dispatch}
            playerId={userId}
            players={players}
          />
        )}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {players && players[userId] && (
              <div className="overflow-hidden rounded-lg shadow-2xl">
                {/* // This needs to show only when the user is a players //
                  otherwise it's too soon and won't connect to the Peers */}
                {/* // TODO: Provide this so I don't have to pass in the iceServers each time */}
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
              <GameActionsContainer
                // TODO: All of these can be provided from the GamePovider
                dispatch={dispatch}
                homeColor="b"
                playerId={userId}
              />
              <div className="flex-1" />
              <GameStateWidget
                game={state.game}
                gameTimeClass={state.gameTimeClass}
                id={roomId}
                onTimerFinished={() => {
                  dispatch({
                    type: 'play:timeout',
                  });
                }}
              />
            </div>
            <div className="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl">
              <GameNotation />
              {/* <FreeBoardNotation
              history={displayState.history}
              focusedIndex={displayState.focusedIndex}
              onDelete={() => {}}
              onRefocus={onRefocus}
            /> */}
            </div>
          </div>
        }
      />
    </GameProvider>
  );
};
