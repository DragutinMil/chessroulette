'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier } from 'movex-core-util';
import { MovexBoundResource, useMovexBoundResourceFromRid } from 'movex-react';
import { ChessFEN, ChessFENBoard, min } from '@xmatter/util-kit';
import { useUserId } from 'apps/chessroulette-web/hooks/useUserId/useUserId';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useLearnActivitySettings } from './useLearnActivitySettings';
import { useSearchParams } from 'next/navigation';
import { useDesktopRoomLayout } from './useDesktopRoomLayout';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { EditModeState } from './types';
import { SideContainer } from './containers/SideContainer';
import { MainContainer } from './containers/MainContainer';

type Props = {
  rid: ResourceIdentifier<'room'>;
  fen?: ChessFEN;
  iceServers: IceServerRecord[];
};

export const LearnActivity = ({ iceServers, ...props }: Props) => {
  const userId = useUserId();
  const settings = useLearnActivitySettings();
  const searchParams = useSearchParams();
  const isEditParamsSet = searchParams.get('edit') === '1';

  const [editMode, setEditMode] = useState<{
    isActive: boolean;
    state: EditModeState;
  }>({
    isActive: isEditParamsSet,
    state: {
      fen: ChessFENBoard.STARTING_FEN,
      orientation: 'white',
    },
  });

  useEffect(() => {
    setEditMode((prev) => ({
      ...prev,
      isActive: isEditParamsSet,
    }));
  }, [isEditParamsSet]);

  const containerRef = useRef(null);
  const desktopLayout = useDesktopRoomLayout(containerRef, undefined, {
    sideMinWidth: 420,
  });

  const [mainPanelRealSize, setMainPanelRealSize] = useState(0);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    setBoardSize(min(desktopLayout.container.height, mainPanelRealSize));
  }, [desktopLayout.main, mainPanelRealSize]);

  return (
    <div
      className="flex w-full h-full align-center justify-center"
      ref={containerRef}
    >
      <MovexBoundResource
        movexDefinition={movexConfig}
        rid={props.rid}
        onReady={({ boundResource }) => {
          boundResource.dispatch({
            type: 'join',
            payload: { userId },
          });
        }}
        onComponentWillUnmount={(s) => {
          if (s.init) {
            s.boundResource.dispatch({
              type: 'leave',
              payload: { userId },
            });
          }
        }}
        render={() => null}
      />
      <PanelGroup autoSaveId="learn-activity" direction="horizontal">
        <Panel
          defaultSize={70}
          className="sbg-green-100 flex justify-end"
          onResize={(nextPct) => {
            if (!desktopLayout.updated) {
              return;
            }

            setMainPanelRealSize(
              (nextPct / 100) * desktopLayout.container.width
            );
          }}
          tagName="main"
          // defaultSize={
          //   51
          //   // desktopLayout.updated
          //   //   ? (desktopLayout.side.width.val /
          //   //       desktopLayout.main.width.val) *
          //   //     100
          //   //   : 51
          // }
        >
          <MainContainer
            editMode={editMode}
            rid={props.rid}
            boardSizePx={boardSize}
            onUpdateEditModeState={(next) =>
              setEditMode((prev) => ({
                ...prev,
                state: next(prev.state),
              }))
            }
          />
        </Panel>
        <div className="w-8 sbg-blue-100 relative flex flex-col items-center justify-center">
          <div className="flex-1">
            {settings.canFlipBoard && (
              <IconButton
                icon="ArrowsUpDownIcon"
                iconKind="outline"
                type="clear"
                size="sm"
                tooltip="Flip Board"
                tooltipPositon="right"
                className="mb-2"
                onClick={() => {
                  // dispatch({
                  //   type: 'changeBoardOrientation',
                  //   payload:
                  //     activityState.boardOrientation === 'black'
                  //       ? 'white'
                  //       : 'black',
                  // });
                }}
              />
            )}
          </div>

          <PanelResizeHandle
            className="w-1 h-20 rounded-lg bg-slate-600"
            title="Resize"
          />
          <div className="flex-1" />
        </div>
        <Panel minSize={25} maxSize={40} tagName="aside">
          <SideContainer
            editMode={editMode}
            iceServers={iceServers}
            rid={props.rid}
            onUpdateEditModeState={(next) =>
              setEditMode((prev) => ({
                ...prev,
                state: next(prev.state),
              }))
            }
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};
