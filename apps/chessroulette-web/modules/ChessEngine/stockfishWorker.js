let reviewWorker = null;
//let aiWorker = null;

// Stockfish 18, lite NNUE, single-threaded (nmrugg/chess.com build - isti toolchain kao
// napusteni stockfish-17-single u public/, samo lite net i verzija vise). Single-threaded
// namerno: nema COOP/COEP headera u projektu, pa je Threads value 2 dole ionako no-op u produkciji.
export function getStockfishWorker() {
  if (reviewWorker == null) {
    reviewWorker ||= new Worker('/sf18/stockfish-18-lite-single.js');
  }
  return reviewWorker;
}

export function newStockfish() {
  reviewWorker = new Worker('/sf18/stockfish-18-lite-single.js');
  return reviewWorker;
}

export function terminateStockfish() {
  // if (aiWorker) {
  //   aiWorker.terminate();
  //   aiWorker = null;
  // }
  if (reviewWorker) {
    reviewWorker.terminate();
    reviewWorker = null;
  }
}
