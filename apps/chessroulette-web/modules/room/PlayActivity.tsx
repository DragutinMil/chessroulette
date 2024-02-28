'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier } from 'movex-core-util';
import { MovexBoundResource } from 'movex-react';
// import { ChessGame } from '../ChessGame/ChessGame';
import { ContainerWithDimensions } from 'apps/chessroulette-web/components/ContainerWithDimensions';

type Props = {
  rid: ResourceIdentifier<'room'>;
};

export default (props: Props) => {
  return (
    <MovexBoundResource
      movexDefinition={movexConfig}
      rid={props.rid}
      render={({ boundResource: { state, dispatch } }) => {
        return (
          <ContainerWithDimensions
            className="h-full w-full"
            render={(s) => (
              // <ChessGame sizePx={s.height} />
              // </div>
              <div></div>
            )}
          />
        );
      }}
    />
  );
};
