// import { authOptions } from '../services/Auth';
// import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/lib';
import { GeneralPageTemplate } from 'apps/chessroulette-web/templates/GeneralPageTemplate';
import { PropsWithChildren } from 'react';
import { getCustomServerSession } from '../services/Auth/lib';
import { authOptions } from '../services/Auth';

export const AuthenticatedPage = async ({ children }: PropsWithChildren) => {
  const session = (await getCustomServerSession(authOptions)) || undefined;

  if (!session) {
    return <div>you need to login</div>;
  }

  return (
    <GeneralPageTemplate session={session}>{children}</GeneralPageTemplate>
  );
};
