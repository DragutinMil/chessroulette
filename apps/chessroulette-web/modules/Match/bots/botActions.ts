import { DispatchOf } from '@xmatter/util-kit';
import { MatchActions } from '../movex';
import { ChatBotWidget } from '../widgets/ChatBotWidget';
import { ChatMessage, ActiveBot } from '@app/modules/Match/movex/types';
import { Chess } from 'chess.js';
export const botSendRematchOffer = (
  dispatch: DispatchOf<MatchActions>,
  byPlayerId: string,
  delay = 1000
) => {
  setTimeout(() => {
    dispatch((masterContext) => ({
      type: 'play:sendOffer',
      payload: {
        byPlayer: byPlayerId,
        offerType: 'rematch',
        timestamp: masterContext.requestAt(),
      },
    }));
  }, delay);
};

export const botRejectDrawOffer = (
  dispatch: DispatchOf<MatchActions>,
  activeBot: ActiveBot,
  messages: ChatMessage[],
  pgn: string,
  delay = 1000
) => {
  if (!activeBot) {
    return;
  }
  setTimeout(() => {
    dispatch({ type: 'play:cancelOffer' });
  }, delay);
  const prompt =
    'User offer draw. Explain shortly to user that you dont accept offer';

  const sendMessage = async () => {
    const content = await ChatBotWidget(prompt, pgn, messages, activeBot.name);
    if (content) {
      dispatch({
        type: 'play:sendMessage',
        payload: {
          senderId: activeBot.id,
          content: content.answer.text,
          timestamp: Date.now(),
          responseId: content.id,
        },
      });
    }
  };
  sendMessage();
};

export const onTakeBackOfferBot = (
  dispatch: DispatchOf<MatchActions>,
  delay = 1000
) => {
  setTimeout(() => {
    dispatch({ type: 'play:acceptTakeBack' });
  }, delay);
};

export const botTalkInitiation = (
  dispatch: DispatchOf<MatchActions>,
  activeBot: ActiveBot,
  messages: ChatMessage[],
  pgn: string,
  botColor?: string
) => {
  if (!activeBot) {
    return;
  }
  console.log(' pgn.length', pgn.length);

  if (messages.length == 0 && pgn.length > 15 && pgn.length > 19) {
    const pgnToUciMoves = (pgn: string) => {
      const chess = new Chess();
      chess.loadPgn(pgn);

      return chess.history({ verbose: true }).map((m) => {
        let uci = m.from + m.to;
        if (m.promotion) uci += m.promotion;
        return uci;
      });
    };
    const UciFormat = pgnToUciMoves(pgn);
    const prompt =
      'give me an interesting opinion about the opening based on the move we played ' +
      UciFormat;

    const sendMessage = async () => {
      const content = await ChatBotWidget(
        prompt,
        pgn,
        messages,
        activeBot.name,
        UciFormat,
        botColor
      );

      dispatch({
        type: 'play:sendMessage',
        payload: {
          senderId: activeBot.id,
          content: content.answer.text,
          timestamp: Date.now(),
          responseId: content.id,
        },
      });
    };

    sendMessage();
  }
};
