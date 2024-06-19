import { GameProvider } from 'apps/chessroulette-web/modules/Play';
import { DesktopRoomLayout } from '../../components/DesktopRoomLayout';
import { GameNotationContainer } from 'apps/chessroulette-web/modules/Play/GameNotationContainer';
import { GameStateWidget } from 'apps/chessroulette-web/modules/Play/components/GameStateWidget/GameStateWidget';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { MatchActivityActions, MatchActivityState } from './movex';
import { DispatchOf } from '@xmatter/util-kit';
import { RIGHT_SIDE_SIZE_PX } from '../Learn/components/LearnBoard';
import { GameBoardContainer } from 'apps/chessroulette-web/modules/Play/GameBoardContainer';
import { CameraPanel } from '../../components/CameraPanel';
import { GameActionsContainer } from 'apps/chessroulette-web/modules/Play/components/GameActionsContainers';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  state: NonNullable<MatchActivityState['activityState']>;
  dispatch: DispatchOf<MatchActivityActions>;
  participants: UsersMap;

  // TODO: deprecate once I have a better system for determingin player colors
  isBoardFlipped?: boolean;
};

export const MatchActivityView = ({
  state,
  dispatch,
  userId,
  iceServers,
  roomId,
  participants,
  isBoardFlipped,
}: Props) => {
  const {
    ongoingPlay: { game },
    ...matchState
  } = state;

  // const []
  const [waitingForNextGame, setWaitingForNextGame] = useState<number>();

  useEffect(() => {
    if (
      game.status === 'complete' &&
      matchState.status !== 'complete' &&
      !waitingForNextGame
    ) {
      const waitMs = 3 * 1000;
      setTimeout(() => {
        dispatch({ type: 'match:startNewGame' });
        setWaitingForNextGame(undefined);
      }, waitMs);

      setWaitingForNextGame(new Date().getTime() + waitMs);
    }
  }, [game.status === 'complete', matchState.status, waitingForNextGame]);

  const results = useMemo(() => {
    return matchState.completedPlays.reduce(
      (prev, nextPlay) => ({
        white: nextPlay.game.winner === 'white' ? prev.white + 1 : prev.white,
        black: nextPlay.game.winner === 'black' ? prev.black + 1 : prev.black,
      }),
      { white: 0, black: 0 }
    );
  }, [matchState]);

  return (
    <GameProvider game={game} players={matchState.players} playerId={userId}>
      <DesktopRoomLayout
        rightSideSize={RIGHT_SIDE_SIZE_PX}
        mainComponent={({ boardSize }) => (
          <GameBoardContainer
            boardSizePx={boardSize}
            isBoardFlipped={isBoardFlipped}
            // TODO: All of these can be provided from the GamePovider
            game={game}
            dispatch={dispatch}
            playerId={userId}
            players={matchState.players}
          />
        )}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {participants && participants[userId] && (
              <div className="overflow-hidden rounded-lg shadow-2xl">
                {/* // This needs to show only when the user is a players //
                  otherwise it's too soon and won't connect to the Peers */}
                {/* // TODO: Provide this so I don't have to pass in the iceServers each time */}
                <CameraPanel
                  participants={participants}
                  userId={userId}
                  peerGroupId={roomId}
                  iceServers={iceServers}
                  aspectRatio={16 / 9}
                />
              </div>
            )}
            <div>
              {waitingForNextGame && (
                <div>
                  Next Game in{' '}
                  {(waitingForNextGame - new Date().getTime()) / 1000}s
                </div>
              )}
            </div>
            <div className="flex flex-row w-full">
              <GameActionsContainer
                // TODO: All of these can be provided from the GamePovider
                dispatch={dispatch}
                homeColor="b"
                playerId={userId}
              />
              <div className="flex-1" />
              <GameStateWidget
                game={game}
                id={roomId}
                onTimerFinished={() => {
                  dispatch({
                    type: 'play:timeout',
                  });
                }}
              />
            </div>
            <div>
              White {results.white} | Black {results.black}
            </div>
            <div className="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl overflow-y-scroll">
              <GameNotationContainer />
              {/* <pre
                className="text-xs"
                style={
                  {
                    // fontSize: 6,
                  }
                }
              >
                {JSON.stringify(state, null, 2)}
              </pre> */}
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
