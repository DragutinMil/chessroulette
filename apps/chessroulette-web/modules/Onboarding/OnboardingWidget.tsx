import React from 'react';
import { Avatar } from 'apps/chessroulette-web/components/Avatar';
import Link from 'next/link';
import { OnboardingMenuContainer } from './OnboardingMenuContainer';
import { CustomSession } from 'apps/chessroulette-web/services/Auth';
import { Text } from 'apps/chessroulette-web/components/Text';
import 'react-contexify/dist/ReactContexify.css';

type Props = {
  session?: CustomSession;
  containerClassName?: string;
};

export const OnboardingWidget: React.FC<Props> = ({
  session,
  containerClassName,
}) => (
  <div className={`flex flex-col ${containerClassName}`}>
    {session?.user ? (
      <OnboardingMenuContainer session={session}>
        <Avatar shortName={session.user.displayName || 'T'} />
      </OnboardingMenuContainer>
    ) : (
      <div className="flex relative w-12 h-12 justify-center items-center text-xs text-slate-400">
        <Link href="/api/auth/signin" className="text-sm">
          <Text>Sign In</Text>
        </Link>
      </div>
    )}
  </div>
);
