import { useCallback } from 'react';
import { GameOffer } from '@app/modules/Game';
import { PlayDialog } from './PlayDialog';
import { usePlayActionsDispatch } from '../../hooks';
import {
  useRouter
} from 'next/navigation';
export type PlayDialogContainerContainerProps = {
  inviteLink: string | undefined;
};

export const PlayDialogContainer = ({
  inviteLink,
}: PlayDialogContainerContainerProps) => {
  const dispatch = usePlayActionsDispatch();
  const pathParts = window.location.pathname.split('/');
  const matchId = pathParts[pathParts.length - 1];
  const router = useRouter();
  const onAcceptOffer = useCallback(
    ({ offer }: { offer: GameOffer['type'] }) => {
      if (offer === 'draw') {
        dispatch({ type: 'play:acceptOfferDraw' });
      } else if (offer === 'rematch') {
        //  const newRematch = async () => {
        //  const response = await fetch(
        //     process.env.NEXT_PUBLIC_API_WEB + 'news_feed_v2',
        //     {
        //       method: 'GET',
        //       headers: {
        //         'Content-Type': 'application/json',
        //       },
             
        //     }
        //   )
        //   if (!response.ok) {
        //     throw new Error(`Error: ${response.status}`);
        //   }
         // const data = await response.json();

          const link1='http://localhost:4200/room/new/opqe66J6n?activity=match&type=bestOf&rounds=1&timeClass=blitz&challengerId=rUESc7G6iBPZ8&challengeeId=czeKS1Q0JDSXJ&startColor=white&challenger=1&userId=rUESc7G6iBPZ8&userDisplayName=Dragutin&theme=op'
          const link2='http://localhost:4200/room/new/opqe66J6n?activity=match&type=bestOf&rounds=1&timeClass=blitz&challengerId=rUESc7G6iBPZ8&challengeeId=czeKS1Q0JDSXJ&startColor=white&userId=czeKS1Q0JDSXJ&userDisplayName=Gulio&theme=op'
          window.open(link1);
          // console.log('iz dialoga data',link1)
          // console.log('match',matchId)
          const url = new URL(window.location.href);
          const myIdNumber = url.searchParams.get('userId');
          if(myIdNumber){
            dispatch({ type: 'play:acceptOfferRematch' , payload:{ rematchData:link2 , myIdNumber: myIdNumber}  });
          }
          
          
        // }
        // newRematch();

       

      } else if (offer === 'takeback') {
        dispatch({ type: 'play:acceptTakeBack' });
      }
    },
    [dispatch]
  );

  return (
    <PlayDialog
      onAcceptOffer={onAcceptOffer}
      onCancelOffer={() => dispatch({ type: 'play:cancelOffer' })}
      onDenyOffer={() => dispatch({ type: 'play:denyOffer' })}
      inviteLink={inviteLink}
    />
  );
};
