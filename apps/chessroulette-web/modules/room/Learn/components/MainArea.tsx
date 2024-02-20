// import { LearnBoardEditor } from '../components/LearnBoardEditor';
// import { LearnBoard } from '../components/LearnBoard';
// import { ArrowsMap, ChapterBoardState, ChapterState, CirclesMap } from '../../activity/reducer';
// import { ChessFEN, swapColor } from '@xmatter/util-kit';
// import { MovexBoundResourceFromConfig } from 'movex-react';
// import movexConfig from 'apps/chessroulette-web/movex.config';

// type Props = {
//   updateType: 'chapterEdit' | '',
//   boardSizePx: number;
//   isBoardEditorActive: boolean;
//   boardState: Omit<ChapterState, 'name'>;
//   // onUpdateBoardState: (
//   //   s: (prev: ChapterBoardState) => ChapterBoardState
//   // ) => void;
//   onUpdateBoardFen: (fen: ChessFEN) => void;
//   onUpdateArrowsMap: (arrowsMap: ArrowsMap) => void;
//   onUpdateCirclesMap: (circlesMap: CirclesMap) => void;

//   // TODO: remove once refacctotred in facor of specific props
//   dispatch: MovexBoundResourceFromConfig<
//     (typeof movexConfig)['resources'],
//     'room'
//   >['dispatch'];
// };

// export const MainArea = ({
//   boardSizePx,
//   boardState,
//   isBoardEditorActive,
//   // onUpdateBoardState,
//   onUpdateArrowsMap,
//   onUpdateBoardFen,
//   onUpdateCirclesMap,
//   dispatch,
// }: Props) => {
//   if (isBoardEditorActive) {
//     return (
//       <LearnBoardEditor
//         state={boardState}
//         boardSizePx={boardSizePx}
//         onUpdated={(fen) => onUpdateBoardState((prev) => ({ ...prev, fen }))}
//         onArrowsChange={(arrowsMap) =>
//           onUpdateBoardState((prev) => ({ ...prev, arrowsMap }))
//         }
//         onCircleDraw={(circleTuple) => {
//           onUpdateBoardState((prev) => {
//             const [at] = circleTuple;
//             const circleId = `${at}`;
//             const { [circleId]: existent, ...restOfCirles } =
//               prev.circlesMap || {};

//             return {
//               ...prev,
//               circlesMap: {
//                 ...restOfCirles,
//                 ...(!!existent
//                   ? undefined // Set it to undefined if same
//                   : { [circleId]: circleTuple }),
//               },
//             };
//           });
//         }}
//         onClearCircles={() => {
//           // onUpdateBoardState((prev) => ({
//           //   ...prev,
//           //   circlesMap: {},
//           // }));
//           dispatch({ type: 'arrowChange', payload });
//         }}
//         onFlipBoard={() => {
//           onUpdateBoardState((prev) => ({
//             ...prev,
//             orientation: swapColor(prev.orientation),
//           }));
//         }}
//       />
//     );
//   }

//   return (
//     <LearnBoard
//       sizePx={boardSizePx}
//       {...boardState}
//       onMove={(payload) => {
//         dispatch({ type: 'dropPiece', payload });

//         // TODO: This can be returned from a more internal component
//         return true;
//       }}
//       onArrowsChange={(payload) => {
//         dispatch({ type: 'arrowChange', payload });
//       }}
//       onCircleDraw={(tuple) => {
//         dispatch({
//           type: 'drawCircle',
//           payload: tuple,
//         });
//       }}
//       onClearCircles={() => {
//         dispatch({ type: 'clearCircles' });
//       }}
//     />
//   );
// };
