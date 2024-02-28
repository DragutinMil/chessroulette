'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier, objectKeys } from 'movex-core-util';
import { MovexBoundResource, useMovexBoundResourceFromRid } from 'movex-react';
import { NoSSR } from 'apps/chessroulette-web/components/NoSSR';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from 'apps/chessroulette-web/components/Button';
import { useUserId } from 'apps/chessroulette-web/hooks/useUserId/useUserId';

type Props = {
  rid: ResourceIdentifier<'room'>;
};

export default (props: Props) => {
  // const searchParams = useSearchParams();
  const userId = useUserId();

  // const roomResource = useMovexBoundResourceFromRid(movexConfig, props.rid);

  // useEffect(() => {
  //   const userId = searchParams.get('userId');

  //   if (!(userId && roomResource)) {
  //     return;
  //   }
  // }, [roomResource?.rid]);

  // return <div>works</div>;

  return (
    <MovexBoundResource
      movexDefinition={movexConfig}
      rid={props.rid}
      onReady={(r) => {
        // const userId = searchParams.get('userId');

        if (!userId) {
          return;
        }

        r.boundResource.dispatch({
          type: 'join',
          payload: { userId },
        });
      }}
      // onResourceStateUpdated={(r) => {
      //   console.log('next state', r);
      // }}
      render={({ boundResource: { state, dispatch } }) => {
        console.log('state', state);
        // const userId = searchParams.get('userId');
        const particpants = objectKeys(state.participants);

        return (
          <div>
            Participants
            {particpants.map((s) => {
              return <div key={s}>{s}</div>;
            })}
            <br />
            Counter: {state.counter}
            <Button
              onClick={() => {
                // dispatch({ type: 'inc' });
              }}
            >
              inc
            </Button>
          </div>
        );
      }}
      // If there is a given slot just show the ChatBox
      // Otherwise allow the User to pick one

      //   if (slot) {
      //     return (
      //       <ChatBoxContainer
      //         userSlot={slot as UserSlot}
      //         state={state}
      //         dispatch={dispatch}‰
      //       />
      //     );
      //   }

      //   // Filter out the taken User Slots
      //   const availableUserSlots = objectKeys(state.userSlots).reduce(
      //     (accum, nextSlot) =>
      //       state.userSlots[nextSlot] ? [...accum, nextSlot] : accum,
      //     [] as UserSlot[]
      //   );

      //   return (
      //     <ChatOnboarding
      //       slots={availableUserSlots}
      //       onSubmit={(slot) => {
      //         // Redirect to the same page with the selected  userSlot
      //         router.push({
      //           pathname: router.asPath,
      //           query: { slot },
      //         });
      //       }}
      //     />
      //   );
      // }}
    />
  );
};
