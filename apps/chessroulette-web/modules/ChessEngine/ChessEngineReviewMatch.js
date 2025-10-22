import { Chess } from 'chess.js';

export async function analyzePGN(pgn, { onProgress } = {}, isMobile) {
  // ✅ 1. Kreiramo Stockfish Web Worker
  const stockfish = new Worker('/stockfish-17-single.js');

  // Pripremimo ga za rad
  await sendCommand(stockfish, 'uci');
  await waitFor(stockfish, 'uciok');
  await sendCommand(stockfish, 'setoption name Threads value 2');
  await sendCommand(stockfish, 'setoption name Hash value 64');
  await sendCommand(stockfish, 'setoption name MultiPV value 3');
  await sendCommand(stockfish, 'isready');
  await waitFor(stockfish, 'readyok');

  // ✅ 2. Parsiramo PGN

  const chess = new Chess();
  chess.loadPgn(pgn);
  const moves = chess.history({ verbose: true });

  // Reset da bismo igrali potez po potez
  chess.reset();

  let results = [];
  let previousEval = 0;

  for (let i = 0; i < moves.length; i++) {
    console.log('potez');
    const move = moves[i];
    chess.move(move);

    const fen = chess.fen();

    let { eval: evaluation, topMoves } = await getEvaluation(
      stockfish,
      fen,
      isMobile
    );

    const turn = chess.turn(); // 'w' ili 'b' nakon poteza
    if (turn === 'b') {
      evaluation = -evaluation;
    }

    results.push({
      moveNumber: i + 1,
      move: move.san,
      eval: evaluation,
      diff: (evaluation - previousEval).toFixed(2),
      bestMoves: topMoves,
    });

    previousEval = evaluation;
    const progress = ((i + 1) / moves.length) * 100; // procenat završen
    //  console.log(`Analiza: ${progress.toFixed(1)}%`);

    if (onProgress) onProgress(progress, i + 1, moves.length);
  }

  // Gasimo worker kad završimo
  stockfish.terminate();

  return results;
}

/**
 * Pošalji komandu Stockfish-u
 */
function sendCommand(worker, command) {
  worker.postMessage(command);
  return Promise.resolve();
}

/**
 * Sačekaj da worker pošalje određenu poruku
 */
function waitFor(worker, textToMatch) {
  return new Promise((resolve) => {
    const listener = (event) => {
      if (event.data.includes(textToMatch)) {
        worker.removeEventListener('message', listener);
        resolve();
      }
    };
    worker.addEventListener('message', listener);
  });
}

/**
 * Dobij evaluaciju pozicije iz Stockfish-a
 */
function getEvaluation(worker, fen, isMobile) {
  return new Promise((resolve) => {
    let bestEval = 0;
    let topMoves = [];

    const listener = (event) => {
      const line = event.data;
      if (line.includes('mate 0')) {
        const parts = fen.split(' ');

        bestEval = 'w' ? -50000 : 50000;
      }
      if (
        (isMobile && line.startsWith('info depth 10')) ||
        (!isMobile && line.startsWith('info depth 11'))
      ) {
        const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
        const multipvMatch = line.match(/multipv (\d+) .+ pv (.+)/);

        if (multipvMatch) {
          const index = parseInt(multipvMatch[1], 10);
          const pvMoves = multipvMatch[2].split(' ');

          if (index <= 3) {
            const chess = new Chess(fen); // koristi trenutni FEN
            const from = pvMoves[0].slice(0, 2);
            const to = pvMoves[0].slice(2, 4);
            const promo = pvMoves[0].length === 5 ? pvMoves[0][4] : undefined;

            const move = chess.move({
              from,
              to,
              promotion: promo,
            });

            topMoves[index - 1] = move?.san ?? pvMoves[0];
          }

          // ✅ evaluaciju uzimamo samo iz multipv 1
          if (index === 1 && scoreMatch) {
            if (scoreMatch[1] === 'cp') {
              bestEval = parseInt(scoreMatch[2], 10) / 100;
            } else if (scoreMatch[1] === 'mate') {
              console.log('scoreMatch', scoreMatch[2]);
              const mateIn = parseInt(scoreMatch[2], 10);
              console.log('mateIn', mateIn);
              //  if (type == 'score mate 1' || type == 'score mate 3') {
              //   //  console.log('ide mat 1 ili 3');
              //   const parts = fen.split(' ');

              //   parts[1] === 'w'
              //     ? addGameEvaluation(50000)
              //     : addGameEvaluation(-50000);
              // } else if (type === 'score mate 2') {
              //   const parts = fen.split(' ');
              //    console.log('ide mat 2',parts);
              //   parts[1] === 'b'
              //     ? addGameEvaluation(-50000)
              //     : addGameEvaluation(50000);
              // }
              //ovde proveriti dal se dobro menja za mate in 1,2,3
              bestEval = mateIn > 0 ? 1000 - mateIn : -1000 - mateIn; // Mate closer = stronger eval
            }
          }
        } else if (scoreMatch) {
          // fallback ako nema multipv (ne bi trebalo da se desi jer smo ga setovali)
          bestEval =
            scoreMatch[1] === 'cp'
              ? parseInt(scoreMatch[2], 10) / 100
              : parseInt(scoreMatch[2], 10) > 0
              ? 100
              : -100;
        }
      }

      if (line.startsWith('bestmove')) {
        worker.removeEventListener('message', listener);
        resolve({ eval: bestEval, topMoves });
      }
    };

    worker.addEventListener('message', listener);
    worker.postMessage('setoption name Threads value 2');
    worker.postMessage('setoption name Hash value 64');
    worker.postMessage('setoption name MultiPV value 3');
    //worker.postMessage('ucinewgame');
    worker.postMessage(`position fen ${fen}`);
    isMobile
      ? worker.postMessage(`go depth 10`)
      : worker.postMessage(`go depth 11`);
  });
}
