export const REGEX = {
  cmdType: /^(id|option|uciok$|info|bestmove)/,
  id: /^id (name|author) (.+)$/,
  option:
    /^option name (.+) type (\w+)(?: default ([A-Za-z0-9._\\\:<>/-]+))?(?: min (-?\w+))?(?: max (-?\w+))?(?: var (.+))*$/,
  bestmove: /^bestmove ([A-Za-z0-9\(\)]+)(?: ponder (\w+))?$/,
  info: {
    depth: /\bdepth (\d+)/,
    seldepth: /\bseldepth (\d+)/,
    time: /\btime (\d+)/,
    nodes: /\bnodes (\d+)/,
    currmove: /\bcurrmove (\w+)/,
    currmovenumber: /\bcurrmovenumber (\d+)/,
    hashfull: /\bhashfull (\d+)/,
    nps: /\bnps (\d+)/,
    tbhits: /\btbhits (\d+)/,
    cpuload: /\bcpuload (\d+)/,
    score: /\bscore (cp|mate|lowerbound|upperbound) (-?\d+)/,
    multipv: /\bmultipv (\d+)/,
    pv: /\bpv (.+)/,
    string: /\bstring (.+)/,
    refutation: /\brefutation (.+)/,
    currline: /\bcurrline (.+)/,
  },
};

export const INFO_NUMBER_TYPES = [
  'depth',
  'seldepth',
  'time',
  'nodes',
  'currmovenumber',
  'hashfull',
  'nps',
  'tbhits',
  'cpuload',
  'multipv',
];
