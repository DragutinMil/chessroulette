'use client';

import React from 'react';
import { Session } from 'next-auth';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { signOut } from 'next-auth/react';

type Props = React.PropsWithChildren & {
  session?: Session;
  containerClassName?: string;
  // fallbackRender: () => React.ReactNode;
};

const ONBOARDING_MENU_ID = 'onboarding';

export const OnboardingMenuContainer: React.FC<Props> = (props) => {
  const { show, hideAll } = useContextMenu({ id: ONBOARDING_MENU_ID });

  return (
    <div className="hover:cursor-pointer" onClick={(event) => show({ event })}>
      {props.children}
      <Menu id={ONBOARDING_MENU_ID}>
        <Item
          id="delete"
          onClick={() => signOut()}
          className="hover:cursor-pointer"
        >
          Sign Out
        </Item>
      </Menu>
    </div>
  );
};
