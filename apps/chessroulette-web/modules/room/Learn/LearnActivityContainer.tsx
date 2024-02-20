'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier } from 'movex-core-util';
import { MovexBoundResource, useMovexBoundResourceFromRid } from 'movex-react';
import { ChessFEN, ChessFENBoard, min, noop } from '@xmatter/util-kit';
import { useUserId } from 'apps/chessroulette-web/hooks/useUserId/useUserId';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useLearnActivitySettings } from './useLearnActivitySettings';
import { useSearchParams } from 'next/navigation';
import { useDesktopRoomLayout } from './useDesktopRoomLayout';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { EditModeState } from './types';
// import { SideContainer } from './containers/SideContainer';
// import { MainContainer } from './containers/MainContainer';
import { MainArea } from './components/MainArea';
import { ChapterState, initialChapterState } from '../activity/reducer';
import Streaming from '../StreamingContainer';
import { WidgetPanel } from './components/WidgetPanel';
import { LearnActivity, LearnActivityProps } from './LearnActivity';
import { toRidAsObj } from 'movex';

type Props = {
  rid: ResourceIdentifier<'room'>;
  iceServers: IceServerRecord[];
};

export const LearnActivityContainer = ({ iceServers, ...props }: Props) => {
  const userId = useUserId();
  const movexResource = useMovexBoundResourceFromRid(movexConfig, props.rid);

  const [localState, setLocalState] = useState<
    LearnActivityProps['localState']
  >({
    newChapter: initialChapterState,
  });

  useEffect(() => {
    if (!movexResource) {
      return;
    }

    console.group('Room State Updated');
    console.log(movexResource?.state.activity.activityType);
    console.log(movexResource?.state.activity.activityState);
    console.groupEnd();
  }, [movexResource?.state])

  return (
    <>
      {/* TODO: remove this in favor of the hook once I figure out how to call onComponentWillUnmount */}
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
      <LearnActivity
        dispatch={movexResource?.dispatch}
        roomId={toRidAsObj(props.rid).resourceId}
        userId={userId}
        participants={movexResource?.state.participants || {}}
        iceServers={iceServers}
        localState={localState}
        remoteState={
          movexResource?.state.activity.activityType === 'learn'
            ? movexResource?.state.activity.activityState
            : undefined
        }
      />
    </>
  );
};
