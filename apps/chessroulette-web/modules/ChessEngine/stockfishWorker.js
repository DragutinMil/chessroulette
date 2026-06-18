let reviewWorker = null;
//let aiWorker = null;

export function getStockfishWorker() {
  if(reviewWorker==null  ){
 reviewWorker ||= new Worker('/sf16/stockfish.wasm.js');
  }
  return reviewWorker;
}
//za 16 treba povecati kriterijum za blunder i bad move

export function newStockfish() {
  reviewWorker = new Worker('/sf16/stockfish.wasm.js');
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