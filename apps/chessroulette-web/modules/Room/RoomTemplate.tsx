'use client';
import Header from '../../components/Header/Header';
import { RoomSideMenu } from './components/RoomSideMenu';
import { OnboardingWidget } from '../Onboarding';
import { ActivityState } from './activities/movex';
import { type CustomSession } from '@app/services/Auth';
import { useEffect, useState } from 'react';

type Props = React.PropsWithChildren & {
  activity: ActivityState['activityType'];
  roomId?: string;
  contentClassname?: string;
  themeName?: string;
  session?: CustomSession;
};

export const RoomTemplate = (props: Props) => {
  const [isOutpost, setIsOutpost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOutpost(window.location.href.includes('theme=op'));
    }
  }, []);
  return (
    <div
      className={`
    flex
    h-screen w-screen
    ${props.activity === 'match' ? 'fixed top-0 left-0' : 'relative'}
  `}
      style={{
        background: isOutpost
          ? 'linear-gradient(112.99deg, #07DA63 -68.31%, #000000 23.1%, #01160A 73.92%, #06B251 154.15%)'
          : '#161A2B',
      }}
    >
      <div className="flex flex-col flex-1 ">
        <Header themeName={props.themeName} showConnectionStatus />
        <div
          className={`
           ml-[max(env(safe-area-inset-left),0.5rem)]
           mr-[max(env(safe-area-inset-right),0.5rem)]
           mb-0 md:mb-[max(env(safe-area-inset-right),2rem)]
           md:mt-2
           mt-0
           flex-1 relative overflow-hidden ${props.contentClassname}`}
        >
          <div className="absolute inset-0">{props.children}</div>
        </div>
      </div>
      <menu
        className={`${
          props.activity === 'match' ||
          props.activity === 'aichess' ||
          props.activity === 'ailearn'
            ? 'md:hidden'
            : 'md:block'
        }  hidden  bg-indigo-1300 flex-0 flex flex-col p-2 `}
      >
        <OnboardingWidget session={props.session} />
        <div className="pb-6 border-b border-slate-500 mb-4 " />
        {props.roomId && (
          <RoomSideMenu roomId={props.roomId} activity={props.activity} />
        )}
      </menu>
    </div>
  );
};
