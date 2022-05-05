import { engine } from './engine';
import { Pgn } from 'cm-pgn';

const BLUNDER_THRESHOLD = 2;
const MISTAKE_THRESHOLD = 0.9;
const INACCURACY_THRESHOLD = 0.3;

export async function getMistakes(pgn, setProgress) {
  const data = {
    w: {
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
    },
    b: {
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
    },
  };
  let error;
  let currentScore = 0;
  // Validating PGN and loading it into the board.
  const { moves } = new Pgn(pgn).history;
  const tenPercentOfMoves = Math.floor(moves.length / 10);

  for (let i = 0; i < moves.length; i++) {
    if (i % tenPercentOfMoves === 0) {
      setProgress((currentProgress) => currentProgress + 1);
    }
    const { color, from, to } = moves[i];
    // get player color
    const { fen } = moves[i - 1] ?? {};
    // getting score for move that was made
    const score = await getPositionScore(fen, from + to);
    // checking if move is a mistake and what type of mistake
    const errorType = getErrorType(Number(currentScore), Number(score), color);

    if (errorType) {
      // add error type
      data[color][errorType] += 1;
    }
    currentScore = score;
  }

  return {
    data,
    error,
  };
}

function getPositionScore(fen, move) {
  return new Promise((resolve) => {
    let score;
    // Message handler
    const handleMessage = ({ data }) => {
      if (data.includes('bestmove')) {
        // Removing listeners
        engine.close();
        // normalizing centipawns score
        resolve(Number(score) / 100);
      }

      if (data.includes('score cp')) {
        const text = data.split(' ');
        // this gives us [... ,'score', 'cp', CP_NUMBER, ...]
        const cpIndex = text.indexOf('cp') + 1;

        score = text[cpIndex];
      }
    };

    engine.subscribe(handleMessage).init().evalPosition(fen, move);
  });
}

function getErrorType(currentScore, nextScore, color) {
  let diff;
  const isWhiteMoved = color === 'w';
  if (
    // if nextScore -2 and currentScore 0.5
    (isWhiteMoved && nextScore < currentScore) ||
    // if nextScore 2 and currentScore -0.5
    (!isWhiteMoved && nextScore > currentScore)
  ) {
    diff = currentScore - nextScore;
  }
  if (diff > INACCURACY_THRESHOLD) {
    if (diff >= BLUNDER_THRESHOLD) {
      return 'blunder';
    }

    // 0.9 >= move < 2
    if (diff < BLUNDER_THRESHOLD && diff >= MISTAKE_THRESHOLD) {
      return 'mistake';
    }

    // 0.9 > move >= 0.3
    if (diff >= INACCURACY_THRESHOLD && diff < MISTAKE_THRESHOLD) {
      return 'inaccuracy';
    }

    return undefined;
  }
}
