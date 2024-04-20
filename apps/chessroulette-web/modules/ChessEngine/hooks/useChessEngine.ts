import { useContext, useEffect, useState } from 'react';
import { ChessEngineContext } from '../ChessEngineContext';
import { ChessFEN, ChessFENBoard, invoke } from '@xmatter/util-kit';
import { engineLineSchema } from '../../room/activities/Learn/engine';
import { evaluate } from '../lib';
import { BestLine, IdUCIResponse } from '../lib/types';

export const useChessEngineClient = () => useContext(ChessEngineContext);

export const useChessEngineFromFen = (
  gameId: string,
  fen: ChessFEN,
  searchOpts: { depth: number } = { depth: 10 }
) => {
  const engine = useChessEngineClient();

  const [state, setState] = useState<{
    canSearch: boolean;
    id?: IdUCIResponse;
    bestMove?: string;
    bestLine?: BestLine;
    fen: ChessFEN;
  }>({
    canSearch: false,
    fen,
  });

  useEffect(() => {
    if (!engine.ready) {
      // Reset the state if not ready anymore
      setState({
        fen,
        canSearch: false,
      });
      return;
    }

    // Set the Engine Id
    setState((prev) => ({
      ...prev,
      id: engine.client.id,
    }));

    const unsubscribers = [
      engine.client.on('readyok', () => {
        setState((prev) => ({
          ...prev,
          // Any time the readyok is received the seearch can happen
          canSearch: true,
        }));
      }),
      engine.client.on('info', (msg) => {
        // TODO: This should be inside the client parser
        const r = engineLineSchema.safeParse(msg);

        if (r.success) {
          setState((prev) => {
            const nextLine = r.data;

            // if it's deeper don't update it
            if (prev.bestLine?.depth && prev.bestLine.depth > nextLine.depth) {
              return prev;
            }

            const fenState = new ChessFENBoard(prev.fen).getFenState();

            const nextEvaluation = evaluate(
              {
                data: `info depth ${nextLine.score.unit} ${nextLine.score.value}`,
              },
              fenState.turn
            );

            return {
              ...prev,
              bestLine: {
                ...nextLine,
                pv: nextLine.pv?.split(' '),
                evaluation: nextEvaluation,
              },
            };
          });
        }
      }),
      engine.client.on('bestmove', (msg) => {
        setState((prev) => ({
          ...prev,
          bestMove: msg.bestmove,
        }));
      }),
    ];

    return () => unsubscribers.forEach(invoke);
  }, [engine.ready]);

  // Search
  useEffect(() => {
    if (!engine.ready) {
      // setLoading(true);
      return;
    }

    // If the canSearch is not active return early
    if (!state.canSearch) {
      return;
    }

    // Update the FEN
    setState((prev) => ({
      ...prev,
      fen,
      bestLine: undefined,
      bestMove: undefined,
    }));

    engine.client.searchPosition(fen);
    engine.client.go(searchOpts);
  }, [engine.ready, state.canSearch, fen, searchOpts.depth]);

  useEffect(() => {
    if (!engine.ready) {
      return;
    }

    setState((prev) => ({
      ...prev,
      // Set this to false until the new game is ready
      canSearch: false,
    }));

    // Every time the game id changes set a new game
    // This will send a "isready" cmd
    engine.client.newGame();
  }, [engine.ready, gameId]);

  return state;
};
