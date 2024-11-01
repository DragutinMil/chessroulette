// 'use client';

// import { objectOmit } from '@xmatter/util-kit';

// // TODO: These 2 should not depend on Play and Learn
// import { usePlayActivitySettings } from '../Play/usePlayActivitySettings';
// import { JoinRoomLinkProps } from '../Learn/activitySettings';
// import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';

// export type MatchActivitySettings = {
//   isBoardFlipped: boolean;
// } & JoinRoomLinkProps;

// export const useMatchActivitySettings = (): MatchActivitySettings => {
//   // const playActivitySettings = usePlayActivitySettings();

//   const updateableSearchParams = useUpdateableSearchParams();
//   // const isHost = updateableSearchParams.get('host') === '1';
//   // const gameTimeClass: GameTimeClass = invoke(() => {
//   //   if (!updateableSearchParams) {
//   //     return 'untimed';
//   //   }

//   //   const gameTimeClass = updateableSearchParams.get('gameTimeClass');
//   //   const parser = gameTimeClassRecord.safeParse(gameTimeClass);

//   //   return parser.success ? parser.data : 'untimed';
//   // });

//   return {
//     isBoardFlipped: updateableSearchParams.get('flipped') === '1',
//     // joinRoomLinkTooltip: 'Invite Player',
//     // gameTimeClass,
//     // showJoinRoomLink: isHost,
//     // joinRoomLinkParams: {
//     //   flipped: '1',
//     // },
//   };

//   return objectOmit(playActivitySettings, ['gameTimeClass']);
// };
