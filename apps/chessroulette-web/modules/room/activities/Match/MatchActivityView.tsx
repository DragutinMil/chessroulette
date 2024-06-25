import { GameProvider } from 'apps/chessroulette-web/modules/Play';
import { GameNotationContainer } from 'apps/chessroulette-web/modules/Play/GameNotationContainer';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { MatchActivityActions, MatchActivityState } from './movex';
import { DispatchOf } from '@xmatter/util-kit';
import { RIGHT_SIDE_SIZE_PX } from '../Learn/components/LearnBoard';
import { GameBoardContainer } from 'apps/chessroulette-web/modules/Play/GameBoardContainer';
import { CameraPanel } from '../../components/CameraPanel';
import { GameActionsContainer } from 'apps/chessroulette-web/modules/Play/components/GameActionsContainers';
import { useMemo } from 'react';
import { PlayersBySide } from 'apps/chessroulette-web/modules/Play/types';
import { ResizableDesktopLayout } from 'apps/chessroulette-web/templates/ResizableDesktopLayout';
import { useRoomLinkId } from '../../hooks/useRoomLinkId';
import { MatchStateProvider } from 'apps/chessroulette-web/modules/room/activities/Match/providers/MatchStateProvider';
import { MatchStateDisplay } from './components/MatchStateDisplay';
import { MatchStateDialogContainer } from './components/MatchStateDialogContainer';
import { initialPlayState } from 'apps/chessroulette-web/modules/Play/store';

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
  const { ongoingPlay, ...matchState } = state;

  const game = useMemo(
    () =>
      ongoingPlay?.game ||
      matchState.completedPlays.slice(-1)[0].game ||
      // Default to Initial Play State if no ongoing or completed
      initialPlayState.game,
    [ongoingPlay, matchState.completedPlays]
  );

  const { joinRoomLink } = useRoomLinkId('match');

  const playersBySide = useMemo((): PlayersBySide => {
    const whiteDisplayName = participants[matchState.players.white.id]
      ? participants[matchState.players.white.id].displayName
      : undefined;
    const blackDisplayName = participants[matchState.players.black.id]
      ? participants[matchState.players.black.id].displayName
      : undefined;

    if (userId === matchState.players.black.id) {
      return {
        home: {
          ...matchState.players.black,
          color: 'black',
          ...(blackDisplayName && { displayName: blackDisplayName }),
        },
        away: {
          ...matchState.players.white,
          color: 'white',
          ...(whiteDisplayName && { displayName: whiteDisplayName }),
        },
      };
    }

    return {
      home: {
        ...matchState.players.white,
        color: 'white',
        ...(whiteDisplayName && { displayName: whiteDisplayName }),
      },
      away: {
        ...matchState.players.black,
        color: 'black',
        ...(blackDisplayName && { displayName: blackDisplayName }),
      },
    };
  }, [userId, matchState.players, participants]);

  return (
    <GameProvider game={game} players={matchState.players} playerId={userId}>
      <MatchStateProvider {...matchState} ongoingPlay={ongoingPlay}>
        <ResizableDesktopLayout
          rightSideSize={RIGHT_SIDE_SIZE_PX}
          mainComponent={({ boardSize }) => (
            <GameBoardContainer
              boardSizePx={boardSize}
              joinRoomLink={joinRoomLink}
              isBoardFlipped={isBoardFlipped}
              overlayComponent={
                <MatchStateDialogContainer
                  dispatch={dispatch}
                  playerId={userId}
                  joinRoomLink={joinRoomLink}
                />
              }
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
              <MatchStateDisplay playersBySide={playersBySide} />

              <div className="bg-slate-700 p-3 flex flex-col gap-2 flex-1 min-h-0 rounded-lg shadow-2xl overflow-y-scroll">
                <GameNotationContainer />
                <div className="flex gap-2 bor">
                  <GameActionsContainer
                    // TODO: All of these can be provided from the GamePovider
                    dispatch={dispatch}
                    homeColor={playersBySide.home.color}
                    playerId={userId}
                  />
                </div>
              </div>
            </div>
          }
        />
      </MatchStateProvider>
    </GameProvider>
  );
};
