'use client';

import { MovexProvider } from 'movex-react';
import movexConfig from '../movex.config';
import { useUserId } from '../hooks/useUserId/useUserId';
import { config } from '../config';

export default (props: React.PropsWithChildren) => {
  const userId = useUserId();

  if (!userId) {
    return null;
  }

  return (
    <MovexProvider
      movexDefinition={movexConfig}
      endpointUrl={config.MOVEX_ENDPOINT_URL}
      clientId={userId || undefined}
      // socketUrl={config.MOVEX_URL}
      onConnected={(instance) => {
        // console.log('Movex Connected', instance.getClientId());

        // if (!counterRid) {
        //   instance
        //     .register('counter')
        //     .create(initialCounterState)
        //     .map((counterResource) => {
        //       window.location.href += `?rid=${toRidAsStr(counterResource.rid)}`;
        //     });
        // }
      }}
    >
      {props.children}
    </MovexProvider>
  );
};
