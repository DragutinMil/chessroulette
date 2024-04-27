'use client';

import { MovexProvider } from 'movex-react';
import movexConfig from '../movex.config';
import { config } from '../config';
import { useUser } from '../modules/user/hooks';
import * as Sentry from '@sentry/nextjs';
import { isOneOf } from '@xmatter/util-kit';
import { useEffect } from 'react';

export type MovexClientInfo = {
  displayName: string;
};

export default (props: React.PropsWithChildren) => {
  const user = useUser();

  useEffect(() => {
    console.log('setting sentry user', Sentry);
    Sentry.setUser({
      id: user.id,
    });
  }, [user.id]);

  return (
    <MovexProvider
      movexDefinition={movexConfig}
      endpointUrl={config.MOVEX_ENDPOINT_URL}
      clientId={user.id}
      clientInfo={{
        displayName: user.displayName,
      }}
      logger={{
        onLog(event) {
          if (config.DEBUG_MODE) {
            console[event.method](event.prefix, event.message, event.payload);
          }

          if (isOneOf(event.method, ['error', 'warn', 'log'])) {
            Sentry.captureEvent({
              level: event.method === 'warn' ? 'warning' : event.method,
              message: event.prefix + ' | ' + String(event.message),

              // TODO: Add the staging env
              environment: config.DEBUG_MODE ? 'dev' : 'staging', // TODO: Change this from the env file
            });
          }
        },
      }}
    >
      {props.children}
    </MovexProvider>
  );
};
