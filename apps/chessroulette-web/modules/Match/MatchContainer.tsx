import { useMemo } from 'react';
import { DispatchOf } from '@xmatter/util-kit';
import { GameNotationWidget } from '@app/modules/Game/widgets';
import { UserId, UsersMap } from '@app/modules/User';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { PlayContainer } from './PlayContainer';
import { MatchActions, MatchState } from './movex';
import { MatchProvider } from './providers';
import {
  MatchStateDialogContainer,
  MatchStateDisplayContainer,
} from './containers';
import { PlayControlsContainer } from './Play/containers';

// This should not be here
import { PlayersBySide } from '@app/modules/Match/Play';
import { useRoomLinkId } from '../Room/hooks/useRoomLinkId';

type Props = {
  match: NonNullable<MatchState>;
  userId: UserId;
  participants: UsersMap;
  cameraComponent: React.ReactNode;
  dispatch: DispatchOf<MatchActions>;

  // TODO: deprecate once I have a better system for determingin player colors
  isBoardFlipped?: boolean;
  rightSideSizePx: number;
};

export const MatchContainer = ({
  match,
  userId,
  participants,
  isBoardFlipped,
  cameraComponent,
  rightSideSizePx,
  dispatch,
}: Props) => {
  const { gameInPlay: ongoingGame, ...matchState } = match;

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
    <MatchProvider match={match} userId={userId} dispatch={dispatch}>
      <ResizableDesktopLayout
        rightSideSize={rightSideSizePx}
        mainComponent={({ boardSize }) => (
          <PlayContainer
            // This resets the PlayContainer on each new game
            key={playersBySide.away.color}
            boardSizePx={boardSize}
            isBoardFlipped={isBoardFlipped}
            overlayComponent={
              <MatchStateDialogContainer
                inviteLink={joinRoomLink}
                // playerId={userId}
                // playersBySide={playersBySide}
              />
            }
            // challengerColor={'w'} // TODO: Fix this!!
            // TODO: All of these can be provided from the GamePovider
            // dispatch={dispatch}
            // players={matchState.players}
          />
        )}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {cameraComponent}
            <MatchStateDisplayContainer
              playersBySide={playersBySide}
              dispatch={dispatch}
            />
            <div className="bg-slate-700 p-3 flex flex-col gap-2 flex-1 min-h-0 rounded-lg shadow-2xl overflow-y-scroll">
              <GameNotationWidget />
              <div className="flex gap-2 bor">
                <PlayControlsContainer
                // TODO: All of these can be provided from the GamePovider
                // homeColor={playersBySide.home.color}
                // playerId={userId}
                />
              </div>
            </div>
          </div>
        }
      />
    </MatchProvider>
  );
};
