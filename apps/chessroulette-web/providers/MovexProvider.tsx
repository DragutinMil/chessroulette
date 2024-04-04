'use client';

import { MovexProvider } from 'movex-react';
import movexConfig from '../movex.config';
import { useExistentUserIdOr } from '../hooks/useUserId/useUserId';
import { config } from '../config';

export default (props: React.PropsWithChildren) => {
  const userId = useExistentUserIdOr();

  return (
    <MovexProvider
      movexDefinition={movexConfig}
      endpointUrl={config.MOVEX_ENDPOINT_URL}
      clientId={userId}
    >
      {props.children}
    </MovexProvider>
  );
};
