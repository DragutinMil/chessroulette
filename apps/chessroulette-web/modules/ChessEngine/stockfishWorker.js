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

let stockfishQueue = Promise.resolve();

// Deljeni worker ima SAMO JEDNU "position/go" pretragu u svakom trenutku -
// PawnyEngine, MateDefenseEngine i Hint box-method upiti (checkmateTechnique.ts)
// su sva tri nezavisna potrosaca istog singletona, i bez ovoga su im se
// stop/position/go pozivi i 'message' listeneri preplitali (jedan bi svojim
// 'stop' prekinuo pretragu u toku kod drugog, ili bi mu neko tudje 'bestmove'
// bio "pojeden" od pogresnog listenera) - to je stvaran uzrok bug-a gde crni
// (MateDefenseEngine) ostane bez odgovora. Sad SVAKI pristup worker-u mora
// kroz ovaj red: `task(worker)` dobija worker i MORA sam resiti svoj Promise
// kad zavrsi (bestmove ili sopstveni timeout) - tek tad sledeci na redu krece.
export function withStockfishLock(task) {
  const run = () => task(getStockfishWorker());
  const result = stockfishQueue.then(run, run);
  stockfishQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
