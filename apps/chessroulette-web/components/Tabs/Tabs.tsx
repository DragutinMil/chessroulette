import { useEffect, useMemo, useState } from 'react';

export type TabsNav = {
  stackPush: () => void;
  stackBack: () => void;
  stackPop: () => void;
  stackTo: (i: number) => void;
  stackIndex: number;
};

type Tab = {
  renderHeader: (p: {
    focus: () => void;
    isFocused: boolean;
  }) => React.ReactNode;
  renderContent: (p: {
    focus: (tabIndex: number) => void;
    isFocused: boolean;
    nav: TabsNav;
  }) => React.ReactNode;
};

type Props = {
  tabs: (Tab | undefined)[];
  renderContainerHeader?: (p: {
    tabs: React.ReactNode[];
    focus: (tabIndex: number) => void;
  }) => React.ReactNode;
  currentIndex?: number;
  containerClassName?: string;
  headerContainerClassName?: string;
  contentClassName?: string;
  onTabChange?: (tabIndex: number) => void;
};

const isInBoundariesOr = (i: number, tabs: unknown[], or: number): number =>
  i > -1 && i < tabs.length ? i : or;

type TabIndex = {
  tabIndex: number;
  stackindex: number; // This is the deeper layer
};

export const Tabs = (props: Props) => {
  const [currentTabIndex, setCurrentTabIndex] = useState(
    isInBoundariesOr(props.currentIndex || 0, props.tabs, 0)
  );

  const [currentStackIndex, setCurrentStackIndex] = useState(0);

  useEffect(() => {
    setCurrentTabIndex(
      isInBoundariesOr(props.currentIndex || 0, props.tabs, 0)
    );
  }, [props.currentIndex]);

  const focus = (i: number) => {
    setCurrentTabIndex(i);
    props.onTabChange?.(i);

    // Reset the stack index each time
    setCurrentStackIndex(0);
  };

  const headerComponent = useMemo(() => {
    const tabs = props.tabs
      // .filter((m) => !!m)
      .map((p, i) => {
        // if (!p) {
        //   return null;
        // }

        return (
          <div key={i}>
            {p?.renderHeader({
              focus: () => focus(i),
              isFocused: i === currentTabIndex,
            })}
          </div>
        );
      });

    if (props.renderContainerHeader) {
      return props.renderContainerHeader({
        tabs,
        focus,
      });
    }

    return (
      <div className={`flex flex-row ${props.headerContainerClassName}`}>
        {tabs.map((c) => c)}
      </div>
    );
  }, [currentTabIndex, props.renderContainerHeader, focus]);

  return (
    <div className={props.containerClassName}>
      {headerComponent}
      <div className={`flex-1 ${props.contentClassName}`}>
        {props.tabs[currentTabIndex]?.renderContent({
          focus: () => focus(currentTabIndex),
          isFocused: true,
          nav: {
            stackPush: () => {
              setCurrentStackIndex((prev) => prev + 1);
            },
            stackBack: () => {
              setCurrentStackIndex((prev) => (prev > 0 ? prev - 1 : prev));
            },
            stackPop: () => {
              setCurrentStackIndex(0);
            },
            stackTo: setCurrentStackIndex,
            stackIndex: currentStackIndex,
          },
        })}
      </div>
    </div>
  );
};
