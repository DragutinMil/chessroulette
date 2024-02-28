import React from 'react';
import { Avatar } from 'apps/chessroulette-web/components/Avatar';
import { Session } from 'next-auth';
import Link from 'next/link';
import 'react-contexify/dist/ReactContexify.css';
import { OnboardingMenuContainer } from './OnboardingMenuContainer';

type Props = {
  session?: Session;
  containerClassName?: string;
};

export const OnboardingWidget: React.FC<Props> = ({
  session,
  containerClassName,
}) => {
  return (
    <div className={`flex flex-col ${containerClassName}`}>
      <OnboardingMenuContainer>
        <Avatar shortName={'U'} />
      </OnboardingMenuContainer>
      {/* {session?.user ? (
        <OnboardingMenuContainer>
          <Avatar shortName={session.user.name || 'T'} />
        </OnboardingMenuContainer>
      ) : (
        <Link href="/api/auth/signin">Sign In</Link>
      )} */}
    </div>
  );
};
