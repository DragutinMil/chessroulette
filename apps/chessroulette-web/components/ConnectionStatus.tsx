'use client';

import { MovexConnection } from 'movex-react';

export default () => {
  return (
    // <div>Fix me</div>
    <MovexConnection
      render={({ connected, clientId }) => (
        <div className='text-sm text-slate-300 text-right'>
          <div>{connected ? 'Movex Connected' : 'Not Connected'}</div>
          <div>Movex Client: {clientId}</div>
        </div>
      )}
    />
  );
};
