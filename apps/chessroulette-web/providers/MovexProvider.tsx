'use client';

import { useEffect } from 'react';
import { MovexProvider } from 'movex-react';
import { captureEvent, setUser } from '@sentry/nextjs';
import { isOneOf } from '@xmatter/util-kit';
import movexConfig from '../movex.config';
import { config } from '../config';
import { useUser } from '../modules/user/hooks';

export type MovexClientInfo = {
  displayName: string;
};

export default (props: React.PropsWithChildren) => {
  const user = useUser();

  useEffect(() => {
    setUser(user);
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

          if (isOneOf(event.method, ['error', 'warn'])) {
            captureEvent({
              level: event.method === 'warn' ? 'warning' : event.method,
              message: event.prefix + ' | ' + String(event.message),
              environment: config.ENV,
              // TODO: add more info if needed, like the resource id at least so it can be checked in the store
              //  if not more relevant, timely stuff
              // extra: {}
            });
          }
        },
      }}
    >
      {props.children}
    </MovexProvider>
  );
};
