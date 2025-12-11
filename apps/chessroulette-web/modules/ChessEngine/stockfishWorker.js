let stockfishWorker = null;

export function getStockfishWorker() {
  if (stockfishWorker) return stockfishWorker;
  stockfishWorker = new Worker('/stockfish-17-single.js');
  return stockfishWorker;
}

export function newStockfish() {
  stockfishWorker = new Worker('/stockfish-17-single.js');
  return stockfishWorker;
}

export function terminateStockfish() {
  if (stockfishWorker) {
    stockfishWorker.terminate();
    stockfishWorker = null;
  }
}
