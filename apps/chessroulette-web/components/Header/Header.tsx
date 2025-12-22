'use client';
import Link from 'next/link';
import { Logo } from '@app/components/Logo';
import { CustomSession } from '@app/services/Auth';
import ConnectionStatus from './ConnectionStatus';
import Image from 'next/image';
import GithubLogo from './assets/github-mark-white.svg';
import DiscordLogo from './assets/discord-icon-svgrepo-com.svg';
import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';
// import Cookies from 'js-cookie';
type Props = {
  themeName?: string;
  showConnectionStatus?: boolean;
  showOnboarding?: boolean;
  session?: CustomSession;
};

export default (props: Props) => {
  const router = useRouter();
  return (
    <header
      className="
      pl-[max(env(safe-area-inset-left),1.5rem)]
      pr-[max(env(safe-area-inset-right),1.5rem)]
      pt-2 md:pt-[max(env(safe-area-inset-top),1rem)]
      pb-0 md:pb-[1rem] 
      flex justify-between "
    >
      <div
        className="flex justify-center items-center"
        onClick={() => {
          // if (Cookies.get('sessionToken')) {
          router.push('https://app.outpostchess.com/online-list');
          // }
        }}
      >
        <svg
          className="md:hidden flex relative -left-3"
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#FFFFFF"
        >
          <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
        </svg>
        <Logo themeName={props.themeName} />
      </div>

      <div className="flex gap-6 items-center justify-end">
        {props.showConnectionStatus && <ConnectionStatus />}

        {props.showOnboarding && (
          <>
            <Link
              href="https://github.com/movesthatmatter/chessroulette"
              target="_blank"
              title="GitHub"
              className="hover:opacity-80"
            >
              <Image src={GithubLogo} alt="Github" width={24} />
            </Link>
            <Link
              href="https://discord.gg/hudVbHH4m8"
              target="_blank"
              title="Discord"
              className="hover:opacity-80"
            >
              <Image src={DiscordLogo} alt="Discord" width={24} />
            </Link>
          </>
        )}

        {/* {props.showOnboarding && <OnboardingWidget session={props.session} />} */}
      </div>
    </header>
  );
};
