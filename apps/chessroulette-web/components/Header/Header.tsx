'use client';
import Link from 'next/link';
import { Logo } from '@app/components/Logo';
import { CustomSession } from '@app/services/Auth';
import ConnectionStatus from './ConnectionStatus';
import Image from 'next/image';
import GithubLogo from './assets/github-mark-white.svg';
import DiscordLogo from './assets/discord-icon-svgrepo-com.svg';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
type Props = {
  themeName?: string;
  showConnectionStatus?: boolean;
  showOnboarding?: boolean;
  session?: CustomSession;
};

export default (props: Props) => {
  
  const router = useRouter();


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      alert( event);
      alert( event.data);
      try {
        const token = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        alert( token);

        // Sačuvaj token npr. u localStorage ili u state
       //localStorage.setItem('sessionToken', token);
      } catch (error) {
       alert( error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, []);



  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     alert(event.data);
  //     alert(typeof(event.data))
     
  //     try {
  //       const data = JSON.parse(event.data); // <- pokušaj parsiranja stringa
  //       alert( data);
  //       alert( 'parsed');
  //       if (data.token) {
  //         alert('Primljen token: ' + data.token);
  //         // Sačuvaj token gde ti treba
  //       } else {
  //         alert('Token nije pronađen u data:');
  //       }
  //     } catch (err) {
  //       alert(err);
  //     }
    
      
  
  //   };
  //   alert('prvi prodj');
  //   window.addEventListener('message', handleMessage);
  //   return () => window.removeEventListener('message', handleMessage);
  // }, []);
  return (
    <header
      className="
      pl-[max(env(safe-area-inset-left),1.5rem)]
      pr-[max(env(safe-area-inset-right),1.5rem)]
      pt-2 md:pt-[max(env(safe-area-inset-top),1rem)]
      pb-0 md:pb-[1rem]
      flex justify-between"
    >
      <div
        onClick={() => {
          if (
            document.referrer.includes('app.outpostchess.com') ||
            document.referrer.includes('test-app.outpostchess.com') ||
            document.referrer.includes('localhost:8080')
          ) {
            router.push('https://app.outpostchess.com/online-list');
          }
        }}
      >
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
