import Link from 'next/link';
import { Logo } from './Logo';
import { OnboardingWidget } from '../modules/Onboarding';
import ConnectionStatus from './ConnectionStatus';
import { CustomSession } from '../services/Auth';
import { config } from '../config';

type Props = {
  themeName?: string;
  showConnectionStatus?: boolean;
  showOnboarding?: boolean;
  session?: CustomSession;
};

export default (props: Props) => {
  return (
    <header
      className="
      pl-[max(env(safe-area-inset-left),1.5rem)]
      pr-[max(env(safe-area-inset-right),1.5rem)]
      pt-[max(env(safe-area-inset-top),1rem)]
      pb-[1rem]
      flex justify-between"
    >
      <Link href="/">
        <Logo themeName={props.themeName} />
      </Link>
      <div className="flex gap-4">
        {props.showConnectionStatus && <ConnectionStatus />}
        {props.showOnboarding && <OnboardingWidget session={props.session} />}
      </div>
    </header>
  );
};
