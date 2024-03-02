'use client';

import { MovexProvider } from 'movex-react';
import movexConfig from '../movex.config';
import { useUserId } from '../hooks/useUserId/useUserId';
import { config } from '../config';

export default (props: React.PropsWithChildren) => {
  const userId = useUserId();

  return (
    <MovexProvider
      movexDefinition={movexConfig}
      endpointUrl={config.MOVEX_ENDPOINT_URL}
      clientId={userId || undefined}
    >
      {props.children}
    </MovexProvider>
  );
};
