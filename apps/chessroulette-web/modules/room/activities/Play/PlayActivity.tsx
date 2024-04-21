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
import { Button, IconButton } from 'apps/chessroulette-web/components/Button';
import { PanelResizeHandle } from 'react-resizable-panels';
import { PlayActivityState } from './movex';
import { usePlayActivitySettings } from './usePlayActivitySettings';
import { GameNotation } from '../Meetup/components/GameNotation';
import { GameStateWidget } from './components/GameStateWidget/GameStateWidget';
import { GameStateDialog } from 'apps/chessroulette-web/components/Dialog/GameStateDialog';

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

  const [gameInPendingMode, setGameInPendingMode] = useState(true);
  const [gameFinished, setGameFinished] = useState(false);

  const canPlay = useRef(false);
  const gameSetupComplete = useRef(false);

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

  const gameType = useMemo(() => activitySettings.gameType, []);

  useEffect(() => {
    //TODO - improve logic here, to messy
    if (!canPlay.current) {
      if (participants && objectKeys(participants).length > 1) {
        canPlay.current = true;
        setGameInPendingMode(false);
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

  useEffect(() => {
    console.log('dispatch');
    dispatch({
      type: 'play:setGameType',
      payload: { gameType },
    });
    if (!gameSetupComplete.current) {
      gameSetupComplete.current = true;
    }
  }, [gameType, participants]);

  const overlayComponent = useMemo(() => {
    //TODO - find a way to pass the participants to the dialog
    if (gameInPendingMode || gameFinished) {
      return (
        <GameStateDialog
          gameState={game}
          onRematch={() => {
            dispatch({
              type: 'play:startNewGame',
              payload: { gameType },
            });
          }}
        />
      );
    }
    return null;
  }, [gameInPendingMode, gameFinished]);

  return (
    <DesktopRoomLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <>
          <Playboard
            sizePx={boardSize}
            fen={fen}
            canPlay={canPlay.current}
            overlayComponent={overlayComponent}
            // {...currentChapter}
            // boardOrientation={orientation}
            playingColor={orientation}
            // onFlip={() => {
            //   dispatch({
            //     type: 'loadedChapter:setOrientation',
            //     payload: swapColor(currentChapter.orientation),
            //   });
            // }}
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
          <GameStateWidget
            game={game}
            gameType={gameType}
            id={roomId}
            key={`${roomId}`}
            onTimerFinished={() => {
              dispatch({
                type: 'play:setGameComplete',
                payload: {
                  result: 'timeout',
                },
              });
            }}
          />
          <div className="flex flex-row gap-4">
            <Button
              size="sm"
              bgColor="blue"
              disabled={game.state !== 'ongoing'}
            >
              Offer Draw
            </Button>
            <Button size="sm" bgColor="red" disabled={game.state !== 'ongoing'}>
              Resign
            </Button>
          </div>
          <div className="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl">
            <GameNotation pgn={game.pgn} onUpdateFen={setFen} />
          </div>
        </div>
      }
    />
  );
};
