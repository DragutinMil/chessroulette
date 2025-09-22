'use client';

import { max } from '@xmatter/util-kit';
import { useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { useContainerDimensions } from '@app/components/ContainerWithDimensions';
import { isSpreadAssignment } from 'typescript';

type Props = {
  rightSideSize: number;
  mainComponent:
    | ((p: { boardSize: number }) => React.ReactNode)
    | React.ReactNode;
  rightComponent:
    | ((p: { boardSize: number }) => React.ReactNode)
    | React.ReactNode;
};

export const ResizableDesktopLayout = ({
  rightSideSize,
  mainComponent,
  rightComponent,
}: Props) => {
  const containerRef = useRef(null);
  const [mainPanelPercentageSize, setMainPanelPercentageSize] = useState(0);
  const [boardSize, setBoardSize] = useState(0);
  const containerDimensions = useContainerDimensions(containerRef);
  const [negativeMargin, setNegativeMargin] = useState(0);
  const [rightSidePct, setRightSidePct] = useState(0);
  const isMobile = window.innerWidth <= 768;
  const numMarginLeft = isMobile ? 16 : 8;
  // TODO: This is a WIP - needs refactoring and clearing
  //  especially around the negativeMargin, centering and determinging the new board Size with a right side,
  //  as well as defining the tight side as a constant
  useEffect(() => {
    if (!containerDimensions.updated) {
      return;
    }

    const mainPanelWidthPx =
      (mainPanelPercentageSize / (isMobile ? 62 : 100)) *
      containerDimensions.width;

    const nextBoardSize =
      containerDimensions.height < mainPanelWidthPx
        ? // If the height is smaller than the main panel's width, use that
          // setNegativeMargin((containerDimensions.height - mainPanelWidthPx) / 2);
          containerDimensions.height
        : // otherwise use the totality of the main panel - the side (32px)
          // TODO: Refactor the usage of RIGHT_SIDE_SIZE_PX
          mainPanelWidthPx - rightSideSize;

    setBoardSize(nextBoardSize);

    const rightPanelWidthPx = (rightSidePct / 100) * containerDimensions.width;

    setNegativeMargin(
      max(
        (containerDimensions.width - (nextBoardSize + rightPanelWidthPx)) / 2 -
          numMarginLeft, // TODO: Why 8 here? Need to rework all of this logic once the major bugs are fixed! Now is different for mobile view
        0
      )
    );
  }, [containerDimensions, mainPanelPercentageSize, rightSidePct]);

  return (
    <div
      className="flex w-full h-full align-center justify-center ml-0"
      ref={containerRef}
      style={{
        marginLeft: -negativeMargin,
        flexDirection: 'column',
      }}
    >
      <PanelGroup
        autoSaveId="desktop-room-layout" // TODO should this be dyanmic?
        direction={isMobile ? 'vertical' : 'horizontal'}
        className="relative"
      >
        {/* <div className="absolute bg-red-900 p-2" style={{ right: 0, zIndex: 999}}>{negativeMargin}</div> */}
        {isMobile ? (
          <Panel
            //defaultSize={70}

            className="h-auto [flex:none_!important] my-2 md:my-0 justify-center"
            onResize={setMainPanelPercentageSize}
            tagName="main"
            style={{
              // refactor this to not have to use RIGHT_SIDE_SIZE_PX in so many places
              paddingRight: isMobile ? 0 : rightSideSize,
              alignItems: 'center',
            }}
          >
            {typeof mainComponent === 'function'
              ? mainComponent({ boardSize })
              : mainComponent}
          </Panel>
        ) : (
          <Panel
            defaultSize={70}
            className="flex justify-center  md:justify-end  top-30 h-auto mb-2 md:mb-0"
            onResize={setMainPanelPercentageSize}
            tagName="main"
            style={{
              // refactor this to not have to use RIGHT_SIDE_SIZE_PX in so many places
              paddingRight: isMobile ? 0 : rightSideSize,
              alignItems: 'center',
            }}
          >
            {typeof mainComponent === 'function'
              ? mainComponent({ boardSize })
              : mainComponent}
          </Panel>
        )}

        <Panel
          defaultSize={33}
          minSize={33}
          maxSize={40}
          tagName="aside"
          className="flex  flex-row space-between w-full relative h-full"
          onResize={setRightSidePct}
        >
          {typeof rightComponent === 'function'
            ? rightComponent({ boardSize })
            : rightComponent}
        </Panel>
      </PanelGroup>
    </div>
  );
};
