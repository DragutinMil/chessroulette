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
console.log('activity',props.activity)
  console.log('roomId',props.roomId)
  console.log('contentClassname',props.contentClassname)
  console.log('themeName',props.themeName)
   console.log('session',props.session)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOutpost(window.location.href.includes('theme=op'));
    }
  }, []);
  console.log('activity',props.activity)
  return (
    <div
      className="flex h-screen w-screen"
      style={{ backgroundColor: isOutpost ? '#171819' : '#161A2B' }}
    >
      <div className="flex flex-col flex-1 ">
        <Header themeName={props.themeName} showConnectionStatus />
        <div
          className={`
           ml-[max(env(safe-area-inset-left),0.5rem)]
           mr-[max(env(safe-area-inset-right),0.5rem)]
           mb-[max(env(safe-area-inset-right),2rem)] 
           mt-2
           flex-1 relative overflow-hidden ${props.contentClassname}`}
        >
          <div className="absolute inset-0">{props.children}</div>
        </div>
      </div>
      <menu
        className={`${
          (props.activity === 'match' || props.activity === 'chessai') ? 'md:hidden' : 'md:block'
        }  hidden  bg-indigo-1300 flex-0 flex flex-col p-2`}
      >
        <OnboardingWidget session={props.session} />
        <div className="pb-6 border-b border-slate-500 mb-4" />
        {props.roomId && (
          <RoomSideMenu roomId={props.roomId} activity={props.activity} />
        )}
      </menu>
    </div>
  );
};
