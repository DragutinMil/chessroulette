import Link from 'next/link';
import { Logo } from '@app/components/Logo';
import { CustomSession } from '@app/services/Auth';
import { OnboardingWidget } from '@app/modules/Onboarding';
import ConnectionStatus from './ConnectionStatus';
import Image from 'next/image';
import GithubLogo from './assets/github-mark-white.svg';
import DiscordLogo from './assets/discord-icon-svgrepo-com.svg';

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
      <div className="flex gap-6 items-center justify-end">
        {props.showConnectionStatus && <ConnectionStatus />}
        <Link
          href="https://github.com/movesthatmatter/chessroulette"
          target="_blank"
        >
          <Image src={GithubLogo} alt="Github" width={24} />
        </Link>
        <Link
          href="https://discord.gg/hudVbHH4m8"
          target="_blank"
        >
          <Image src={DiscordLogo} alt="Discord" width={24} />
        </Link>
        {/* {props.showOnboarding && <OnboardingWidget session={props.session} />} */}
      </div>
    </header>
  );
};
