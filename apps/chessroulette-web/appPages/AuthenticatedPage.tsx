import { PropsWithChildren } from 'react';
import { GeneralPageTemplate } from '@app/templates/GeneralPageTemplate';
import { getCustomServerSession } from '@app/services/Auth/getCustomServerSession';
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
