'use client';

import { MovexBoundResource, MovexConnection } from 'movex-react';
import { config } from '../config';
import movexConfig from '../movex.config';

type Props = {
  roomId?: string;
};

export default (props: Props) => {
  return (
    <MovexConnection
      render={({ connected, clientId, ...s }) => (
        <div className="text-sm text-slate-300 text-right text-slate-600 items-end justify-end">
          <div className="flex gap-1 text-right justify-end">
            Status:{' '}
            {connected ? (
              <span className="flex gap-2 items-center">
                Connected
                <span className="w-3 h-3 rounded-full bg-green-500 block" />
              </span>
            ) : (
              <span className="">Not Connected</span>
            )}
          </div>
          <div className="flex gap-3">
            {props.roomId && (
              <MovexBoundResource
                movexDefinition={movexConfig}
                rid={`room:${props.roomId}`}
                render={({ boundResource: { state } }) => {
                  return (
                    <div>
                      Participants: {Object.keys(state.participants).length}
                    </div>
                  );
                }}
              />
            )}
            {config.DEV_MODE && <div>| Movex Client: {clientId}</div>}
          </div>
        </div>
      )}
    />
  );
};
