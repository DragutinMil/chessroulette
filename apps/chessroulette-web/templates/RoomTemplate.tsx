import Header from '../components/Header/Header';
import { RoomSideMenu } from '../modules/room/components/RoomSideMenu';
import { toImgPath } from '../lib/misc';
import { CSSProperties } from 'react';
import { OnboardingWidget } from '../modules/Onboarding';
import bkg_2 from '@app/templates/bkg_2.svg';
import { ActivityState } from '../modules/room/activities/movex';
import { CustomSession } from '../services/Auth';

type Props = React.PropsWithChildren & {
  activity: ActivityState['activityType'];
  roomId?: string;
  contentClassname?: string;
  themeName?: string;
  session?: CustomSession;
};

export function RoomTemplate(props: Props) {
  const style: CSSProperties | undefined =
    props.themeName === 'kids'
      ? {
          backgroundImage: `url(${toImgPath(bkg_2)})`,
          backgroundSize: '50%',
          position: 'relative',
          overflow: 'hidden',
        }
      : undefined;

  return (
    <div className="flex h-screen w-screen" style={style}>
      <div className="flex flex-col flex-1">
        <Header themeName={props.themeName} showConnectionStatus />
        <div
          className={`
             ml-[max(env(safe-area-inset-left),1.5rem)]
             mr-[max(env(safe-area-inset-right),1.5rem)]
             mb-[max(env(safe-area-inset-right),2rem)]
             mt-2
             flex-1 relative overflow-hidden ${props.contentClassname}`}
        >
          <div className="absolute inset-0">{props.children}</div>
        </div>
      </div>
      <menu className="bg-slate-700 flex-0 flex flex-col p-2">
        <OnboardingWidget session={props.session} />
        <div className="pb-6 border-b border-slate-500 mb-4" />
        {props.roomId && (
          <RoomSideMenu roomId={props.roomId} activity={props.activity} />
        )}
      </menu>
    </div>
  );
}
