'use client';

import { MovexBoundResource, MovexConnection } from 'movex-react';
import { config } from '../config';
import movexConfig from '../movex.config';
import { pluralize } from '@xmatter/util-kit';

type Props = {
  roomId?: string;
};

export default (props: Props) => {
  return (
    <MovexConnection
      render={({ connected, clientId, ...s }) => (
        <div className="text-sm text-slate-300 text-right text-slate-600 items-end justify-end">
          <div className="flex gap-1 text-right justify-end">
            {connected ? (
              <span className="flex gap-1 items-center">
                Connected
                <span className="w-2 h-2 rounded-full bg-green-600 block" />
                {props.roomId && (
                  <MovexBoundResource
                    movexDefinition={movexConfig}
                    rid={`room:${props.roomId}`}
                    render={({ boundResource: { subscribers } }) => {
                      const participantsCount = Object.keys(
                        subscribers,
                      ).length;

                      return (
                        <span>
                          ({participantsCount}{' '}
                          {pluralize(!(participantsCount === 1), 'participant')}
                          )
                        </span>
                      );
                    }}
                  />
                )}
              </span>
            ) : (
              <span className="flex gap-1 items-center">
                Not Connected
                <span className="w-2 h-2 rounded-full bg-slate-600 block" />
              </span>
            )}
          </div>

          {config.DEBUG_MODE && <div>Movex Client: {clientId}</div>}
          {/* </div> */}
        </div>
      )}
    />
  );
};
