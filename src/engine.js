class EngineWrapper {
  constructor(src, depth = 14) {
    this.engine = new Worker(src);
    this.depth = depth;
  }

  init() {
    this.engine.postMessage('uci');
    this.engine.postMessage('isready');

    return this;
  }

  close() {
    this.engine.postMessage('stop');
    this.engine.onmessage = null;
  }

  subscribe(handler) {
    this.engine.onmessage = handler;

    return this;
  }

  evalPosition(position, move) {
    this.engine.postMessage('ucinewgame');
    const fen = position ? `fen ${position}` : 'startpos';
    this.engine.postMessage(`position ${fen}`);
    this.engine.postMessage(`go depth ${this.depth} sreachmove ${move}`);
  }
}

export const engine = new EngineWrapper('stockfish.js');
