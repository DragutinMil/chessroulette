import React, { ReactNode, useCallback, useMemo, useRef } from 'react';
import { GenericLayoutExtendedDimensions } from './types';
import { useContainerDimensions } from 'apps/chessroulette-web/components/ContainerWithDimensions';
import { getLayoutSizes, isMobile as getIsMobile, Ratios } from './util';

export type DesktopRoomLayoutProps = {
  renderMainComponent:
    | ReactNode
    | ((d: GenericLayoutExtendedDimensions) => ReactNode);
  renderRightSideComponent:
    | ReactNode
    | ((d: GenericLayoutExtendedDimensions) => ReactNode);
  // renderTopComponent:
  //   | ReactNode
  //   | ((d: GenericLayoutExtendedDimensions) => ReactNode);
  // renderBottomComponent:
  //   | ReactNode
  //   | ((d: GenericLayoutExtendedDimensions) => ReactNode);
  topHeight: number;
  bottomHeight: number;
  offsets?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  minSpaceBetween?: number;
  ratios?: Partial<Ratios>;
  className?: string;
  addRemainingTo?: 'left' | 'center' | 'right' | 'space-between';
};

export const DesktopRoomLayout: React.FC<DesktopRoomLayoutProps> = ({
  offsets = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  minSpaceBetween = 0,
  className,
  ...props
}) => {
  // const cls = useStyles();
  const containerRef = useRef(null);
  const containerDimensions = useContainerDimensions(containerRef);

  // useEffect(() => {
  //   console.log('container dimensions changed', containerDimensions);
  // }, [containerDimensions]);

  const s = useMemo(() => {}, []);

  // TODO: Add this
  // useBodyClass([cls.disableBodyScroll]);

  const getLayout = useCallback(() => {
    if (!containerDimensions.updated) {
      return {
        leftSide: 0,
        mainArea: 0,
        rightSide: 0,
        remaining: 0,
      };
    }

    const horizontalOffset = (offsets.right || 0) + (offsets?.left || 0);
    const verticalOffset = (offsets?.top || 0) + (offsets?.bottom || 0);
    const width =
      containerDimensions.width - horizontalOffset - minSpaceBetween * 2;
    const height = containerDimensions.height - verticalOffset;

    return getLayoutSizes(
      {
        width,
        height,
      },
      {
        leftSide: 0.5,
        mainArea: 1,
        rightSide: 0.5,
        ...props.ratios,
      }
    );
  }, [getLayoutSizes, containerDimensions, minSpaceBetween]);

  const { layout, extendedDimensions } = useMemo(() => {
    const isMobile = getIsMobile(containerDimensions);
    const layout = getLayout();
    const verticalPadding = containerDimensions.height - layout.mainArea;

    // Don't multiply if the side is 0
    const multiplyBy =
      (layout.leftSide > 0 ? 1 : 0) + (layout.rightSide > 0 ? 1 : 0);

    const occupiedWidth = Math.floor(
      layout.leftSide +
        layout.mainArea +
        layout.rightSide +
        minSpaceBetween * multiplyBy
    );

    const extendedDimensions: Omit<
      GenericLayoutExtendedDimensions,
      'container'
    > = {
      left: {
        width: layout.leftSide,
        height: layout.mainArea,
        horizontalPadding: 0,
        verticalPadding,
      },
      right: {
        width: layout.rightSide,
        height: layout.mainArea,
        horizontalPadding: 0,
        verticalPadding,
      },
      center: {
        width: layout.mainArea,
        height: layout.mainArea,
        horizontalPadding: 0,
        verticalPadding,
      },
      // The activity
      main: {
        // width: occupiedWidth,
        width: layout.leftSide + layout.mainArea,
        height: containerDimensions.height,
        horizontalPadding: containerDimensions.width - occupiedWidth,
        verticalPadding,
      },
      top: {
        width: containerDimensions.width,
        height: props.topHeight,
        horizontalPadding: 0,
        verticalPadding,
      },
      bottom: {
        width: containerDimensions.width,
        height: props.bottomHeight,
        horizontalPadding: 0,
        verticalPadding,
      },
      isMobile,
    };

    return {
      extendedDimensions,
      layout,
    };
  }, [containerDimensions, minSpaceBetween]);

  // const renderedTop = useMemo(
  //   () =>
  //     typeof props.renderTopComponent === 'function'
  //       ? props.renderTopComponent({
  //           ...extendedDimensions,
  //           container: extendedDimensions.top,
  //         })
  //       : props.renderTopComponent,
  //   [props.renderTopComponent, extendedDimensions]
  // );

  const renderedActivity = useMemo(() => {
    return typeof props.renderMainComponent === 'function'
      ? props.renderMainComponent({
          ...extendedDimensions,
          container: extendedDimensions.main,
        })
      : props.renderMainComponent;
  }, [props.renderMainComponent, extendedDimensions]);

  const renderedRightSide = useMemo(
    () =>
      typeof props.renderRightSideComponent === 'function'
        ? props.renderRightSideComponent({
            ...extendedDimensions,
            container: extendedDimensions.right,
          })
        : props.renderRightSideComponent,
    [props.renderRightSideComponent, extendedDimensions]
  );

  // const renderedBottom = useMemo(
  //   () =>
  //     typeof props.renderBottomComponent === 'function'
  //       ? props.renderBottomComponent({
  //           ...extendedDimensions,
  //           container: extendedDimensions.bottom,
  //         })
  //       : props.renderBottomComponent,
  //   [props.renderBottomComponent, extendedDimensions]
  // );

  return (
    <div className={`flex flex-col sitems-stretch ${className} sbg-green-100`}>
      {/* in desktop room layout */}
      {/* <div className='fixed p-4' style={{
        top: 10,
        left: 10,
        background: 'rgba(0, 0, 0, .8)',
      }}>
        {JSON.stringify(containerDimensions, null, 2)}
      </div> */}
      {/* <div style={{ height: props.topHeight }}>{renderedTop}</div> */}
      <div
        className={
          'flex flex-col ≥sitems-stretch sitems-end w-full h-full smax-h-full smax-w-full sbg-blue-100'
        }
        ref={containerRef}
        style={
          {
            // This is needed so the flex works correctly on the content children
            // height: `calc(100% - ${props.topHeight + props.bottomHeight}px)`,
          }
        }
      >
        <div className="flex flex-1 sbg-yellow-500">
          <main
            className="flex scontent-end"
            style={{
              width: `${
                extendedDimensions.main.width +
                extendedDimensions.main.horizontalPadding
              }px`,
              // This is a hack to go above the bottom components
              //  But ideally it could be done better!
              // This one was introduced on Oct 14th when I added the Board Settings Bar
              //  But it could also be given as a config from outside if needed!
              height:
                props.bottomHeight > 0
                  ? `calc(100% + ${props.bottomHeight}px)`
                  : '100%',
            }}
          >
            {renderedActivity}
          </main>
          <aside
            style={{
              width: `${layout.rightSide}px`,
              marginLeft: Math.max(minSpaceBetween),

              // This is a hack to go above the top & bottom components
              //  But ideally it could be done better!
              // height: `calc(100% + ${props.topHeight + props.bottomHeight}px)`,
              // height:
              //   props.topHeight + props.bottomHeight > 0
              //     ? `calc(100% + ${props.topHeight + props.bottomHeight}px)`
              //     : '100%',
              background: 'red',
              marginTop: -props.topHeight,
              position: 'relative',
            }}
          >
            {renderedRightSide}
          </aside>
        </div>
      </div>
      {/* <div style={{ height: props.bottomHeight }}>{renderedBottom}</div> */}
    </div>
  );
};
