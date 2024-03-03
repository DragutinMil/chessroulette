import { Metadata } from 'next';
import Template from './PlayTemplate';
import { NoSSR } from 'apps/chessroulette-web/components/NoSSR';
import { PlayerBox } from 'apps/chessroulette-web/components/PlayerBox';
import MainActivity from 'apps/chessroulette-web/modules/room/PlayActivity';
import {
  ResourceIdentifier,
  isResourceIdentifierOfType,
  toResourceIdentifierObj,
} from 'movex-core-util';

export const metadata: Metadata = {
  title: 'Chessroulette | Room',
};

export default function Page({ params }: { params: { slug: string } }) {
  // console.log('params', decodeURIComponent(params.slug));
  // const { rid, slot } = searchParams;

  // If the given "rid" query param isn't an actual rid of type "chat"
  // if (!isRidOfType('chat', rid)) {
  //   return <div>Error - Rid not valid</div>;
  // }

  // console.log('searchParams', searchParams);

  const slug = decodeURIComponent(params.slug);

  if (!isResourceIdentifierOfType('room', slug)) {
    return null;
  }

  const rid: ResourceIdentifier<'room'> = `room:${
    toResourceIdentifierObj(slug).resourceId
  }`;

  return (
    // <MovexBoundResource
    //   movexDefinition={movexConfig}
    //   rid={'room:23'}
    //   render={({ boundResource: { state, dispatch } }) => {
    //     return (

    //     );
    //   }}
    // If there is a given slot just show the ChatBox
    // Otherwise allow the User to pick one

    //   if (slot) {
    //     return (
    //       <ChatBoxContainer
    //         userSlot={slot as UserSlot}
    //         state={state}
    //         dispatch={dispatch}
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
    // />
    <Template
      leftSideComponent={
        <div className="flex space-between flex-col gap-6 h-full sbg-red-100">
          <div className="flex-1 flex items-end justify-end">
            <PlayerBox />
          </div>
          <div className="flex-1">
            <PlayerBox />
          </div>
        </div>
      }
      // mainContainerClass="flex items-center"
      mainComponent={
        <NoSSR>
          <MainActivity rid={rid} />
        </NoSSR>
      }
      // rightSideComponent={<RoomParticipants rid={rid} />}
    />
  );
}
