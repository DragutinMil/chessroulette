import { ShortChessColor, keyInObject } from '@xmatter/util-kit';
import { BestMoveUCIResponse } from './types';

// TODO: Fix this
export const evaluate = (
  event: { data: string },
  // fen: ChessFEN,

  turn: ShortChessColor
) => {
  let evalAsStr = '50';
  let heightsPct = {
    w: 50,
    b: 50,
  };

  const setWhiteHeight = (h: number) => {
    heightsPct = {
      w: h,
      b: 100 - h,
    };

    // console.log('setWhiteHeight', h, heightsPct);
  };

  if (event.data.startsWith('info depth')) {
    let adv, messageEvalType;
    let message = event.data.split(' ');
    // const chess = new Chess();
    // chess.load(fen);
    // const turn = chess.turn();

    if (message.includes('mate')) {
      messageEvalType = `M${message[message.indexOf('mate') + 1]}`;
    } else {
      messageEvalType = message[message.indexOf('cp') + 1];
    }

    let evaluation = convertEvaluation(messageEvalType, turn);

    if (evaluation.startsWith('M')) {
      if (evaluation === 'M0') {
        if (turn === 'b') {
          setWhiteHeight(100);
          // heightsPct = {
          //   w: 100,
          //   b: 0,
          // };
          // setWHeight(100);
        } else {
          // heightsPct = {
          //   w: 0,
          //   b: 100,
          // };
          setWhiteHeight(0);
          // setWHeight(0);
        }

        evalAsStr = evaluation.replace('-', '').replace('M', '#');
        // setSfEval(evaluation.replace('-', '').replace('M', '#'));
      } else {
        // console.log('mate', evaluation);
        if (
          (turn === 'w' && evaluation[1] != '-') ||
          (turn === 'b' && evaluation[1] === '-')
        ) {
          setWhiteHeight(100);
          // setWHeight(100);
        } else {
          setWhiteHeight(0);
          // setWHeight(0);
        }
        evalAsStr = evaluation.replace('-', '').replace('M', '#');
      }
    } else {
      if (evaluation.startsWith('-')) {
        adv = 'b';
      } else {
        adv = 'w';
      }

      if ((parseFloat(evaluation) / 100).toFixed(1) === '0.0') {
        evaluation = String(Math.abs(Number(evaluation)));
      }

      // setSfEval((parseFloat(evaluation) / 100).toFixed(1));
      evalAsStr = (parseFloat(evaluation) / 100).toFixed(1);

      const evaluated = evaluateFunc(Math.abs(parseFloat(evaluation) / 100));

      if (adv === 'w') {
        // setWHeight(50 + evaluated);
        setWhiteHeight(50 + evaluated);
      } else {
        // setWHeight(50 - evaluated);
        setWhiteHeight(50 - evaluated);
      }
    }
  }

  return {
    heightsPct,
    evalAsStr,
  };
};

const convertEvaluation = (ev: string, turn: ShortChessColor) => {
  if (ev.startsWith('M')) {
    ev = `M${ev.substring(1)}`;
  }
  if (turn === 'b' && !ev.startsWith('M')) {
    if (ev.startsWith('-')) {
      ev = ev.substring(1);
    } else {
      ev = `-${ev}`;
    }
  }
  return ev;
};

const evaluateFunc = (x: number) => {
  if (x === 0) {
    return 0;
  } else if (x < 7) {
    return -(0.322495 * Math.pow(x, 2)) + 7.26599 * x + 4.11834;
  } else {
    return (8 * x) / 145 + 5881 / 145;
  }
};

export const isBestMoveUCIResponse = (r: object): r is BestMoveUCIResponse => {
  // TODO: here can add the move as stirng or parse with zod
  return keyInObject(r, 'bestmove') && typeof r.bestmove === 'string';
};
