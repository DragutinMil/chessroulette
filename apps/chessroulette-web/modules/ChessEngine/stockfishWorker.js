let stockfishWorker = null;

export function getStockfishWorker() {
  stockfishWorker = new Worker('/stockfish-17-single.js');
  return stockfishWorker;
}

export function newStockfish() {
  stockfishWorker = new Worker('/sf16/stockfish.js');
  return stockfishWorker;
}
// export function newStockfish() {
//   const wasmSupported = typeof WebAssembly === 'object';
//   stockfishWorker = new Worker(
//     wasmSupported ? '/sf16/stockfish.wasm.js' : '/sf16/stockfish16.js'
//   );
//   return stockfishWorker;
// }

export function terminateStockfish() {
  if (stockfishWorker) {
    stockfishWorker.terminate();
    stockfishWorker = null;
  }
}
