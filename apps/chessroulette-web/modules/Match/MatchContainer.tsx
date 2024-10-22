import { useMemo } from 'react';
import { DispatchOf } from '@xmatter/util-kit';
import {
  // GameProvider,
  PlayersBySide,
  // PlayContainer,
  // GameNotationContainer,
  // GameActionsContainer,
} from '@app/modules/Match/Play';
import * as PlayStore from '@app/modules/Match/Play/movex';
import { UserId, UsersMap } from '@app/modules/user';
import { IceServerRecord } from '@app/providers/PeerToPeerProvider';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { RIGHT_SIDE_SIZE_PX } from '../room/CONSTANTS';
import { CameraPanel } from '../room/components/CameraPanel';
import {
  MatchActivityActions,
  MatchActivityState,
} from '../room/activities/Match/movex';
import { useRoomLinkId } from '../room/hooks/useRoomLinkId';
import {
  MatchStateDialogContainer,
  MatchStateDisplay,
} from '@app/modules/Match/components';
import { MatchStateProvider } from '@app/modules/Match/providers';
import { GameProvider } from '../Game/GameProvider';
import { PlayContainer } from './PlayContainer';
import { GameActionsContainer, GameNotationContainer } from './Play/containers';

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

export const MatchContainer = ({
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
      matchState.endedPlays.slice(-1)[0].game ||
      // Default to Initial Play State if no ongoing or completed
      PlayStore.initialPlayState.game,
    [ongoingPlay, matchState.endedPlays]
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
    <GameProvider game={game} playerId={userId}>
      <MatchStateProvider {...matchState} ongoingPlay={ongoingPlay}>
        <ResizableDesktopLayout
          rightSideSize={RIGHT_SIDE_SIZE_PX}
          mainComponent={({ boardSize }) => (
            <PlayContainer
              // Add this in order to reset the PlayContainer on each new game
              key={playersBySide.away.color}
              boardSizePx={boardSize}
              isBoardFlipped={isBoardFlipped}
              overlayComponent={
                <MatchStateDialogContainer
                  dispatch={dispatch}
                  playerId={userId}
                  joinRoomLink={joinRoomLink}
                  playersBySide={playersBySide}
                />
              }
              // TODO: All of these can be provided from the GamePovider
              game={game}
              dispatch={dispatch}
              userId={userId}
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
              <MatchStateDisplay
                playersBySide={playersBySide}
                dispatch={dispatch}
              />
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
