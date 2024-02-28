import Link from 'next/link';
import { Logo } from './Logo';
import { config } from '../config';
import { OnboardingWidget } from '../modules/Onboarding';
import { type Session } from 'next-auth';
import ConnectionStatus from './ConnectionStatus';

type Props = {
  themeName?: string;
  showOnboarding?: boolean;
  session?: Session;
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
        {config.DEV_MODE && <ConnectionStatus />}
        {props.showOnboarding && <OnboardingWidget session={props.session} />}
      </div>
    </header>
  );
};
