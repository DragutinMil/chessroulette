'use client';

import { MovexProvider } from 'movex-react';
import movexConfig from '../movex.config';
import { config } from '../config';
import { useUser } from '../modules/user/hooks';

export type MovexClientInfo = {
  displayName: string;
}

export default (props: React.PropsWithChildren) => {
  const user = useUser();

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
          console[event.method](
            `${event.prefix} ${event.message}`,
            event.payload
          );
        },
      }}
    >
      {props.children}
    </MovexProvider>
  );
};
