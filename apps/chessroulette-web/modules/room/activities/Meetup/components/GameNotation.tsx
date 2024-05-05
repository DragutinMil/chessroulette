import {
  ChessFEN,
  ChessPGN,
  FBHHistory,
  FBHIndex,
  FreeBoardHistory,
} from '@xmatter/util-kit';
import { FreeBoardNotation } from 'apps/chessroulette-web/components/FreeBoardNotation';
import { useEffect, useState } from 'react';

// type Notation = {
//   history: FBHHistory;
//   displayFen:
// }

type Props = {
  pgn: ChessPGN;
  onUpdateFen: (fen: ChessFEN) => void;
};

const calculateNotation = (pgn: ChessPGN, focusedIndex?: FBHIndex) => {
  const nextHistory = FreeBoardHistory.pgnToHistory(pgn);

  // const [nextHistory, nextFocusedIndex] = focusedIndex
  //   ? FreeBoardHistory.sliceHistory(historyFromPgn, focusedIndex)
  //   : [historyFromPgn, FreeBoardHistory.getLastIndexInHistory(historyFromPgn)];

  const nextFocusedIndex =
    focusedIndex || FreeBoardHistory.getLastIndexInHistory(nextHistory);

  return {
    history: nextHistory,
    focusedIndex: nextFocusedIndex,
  };
};

export const GameNotation = (props: Props) => {
  const [notation, setNotation] = useState(calculateNotation(props.pgn));

  // const [focusedIndex, setFocusedIndex] = useState<FBHIndex>(FreeBoardHistory.getLastIndexInHistory(nextHistor));

  useEffect(() => {
    setNotation(calculateNotation(props.pgn));
  }, [props.pgn]);

  useEffect(() => {
    props.onUpdateFen(
      FreeBoardHistory.historyToFen(
        FreeBoardHistory.sliceHistory(
          notation.history,
          FreeBoardHistory.incrementIndex(notation.focusedIndex)
        )[0]
      )
    );
  }, [notation, props.onUpdateFen]);

  return (
    <FreeBoardNotation
      history={notation.history}
      focusedIndex={notation.focusedIndex}
      onDelete={() => {}}
      onRefocus={(focusedIndex) => {
        // setNotation(calculateNotation(props.pgn, focusedIndex));
        setNotation((prev) => ({
          ...prev,
          focusedIndex,
        }));
        // console.log('refocus', s);
      }}
    />
  );
};
