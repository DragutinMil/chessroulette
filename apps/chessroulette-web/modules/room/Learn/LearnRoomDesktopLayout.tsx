import { DesktopRoomLayout, DesktopRoomLayoutProps } from './DesktopRoomLayout';

export type Props = {
  mainComponent: DesktopRoomLayoutProps['renderMainComponent'];
  mainContainerClass?: string;
  rightSideComponent?: DesktopRoomLayoutProps['renderRightSideComponent'];
  containerClassName?: string;
};

// TODO Not sure if this should be a next template or not

const LAYOUT_RATIOS = {
  leftSide: 0,
  mainArea: 3,
  rightSide: 2.5,
};

export const LearnRoomDesktopLayout = ({
  mainComponent,
  rightSideComponent,
  containerClassName,
}: Props) => (
  <>
    {/* here on server on room desktop layout */}
    <DesktopRoomLayout
      ratios={LAYOUT_RATIOS}
      className={`absolute inset-0 overflow-scroll ${containerClassName}`}
      renderMainComponent={mainComponent}
      renderRightSideComponent={rightSideComponent}
      topHeight={0}
      minSpaceBetween={16}
      bottomHeight={0}
    />
  </>
);
