import { DispatchOf } from '@xmatter/util-kit';
import { MatchActions } from '../movex';
import { ChatBotWidget } from '../widgets/ChatBotWidget';
import { ChatMessage, ActiveBot } from '@app/modules/Match/movex/types';
import { Chess } from 'chess.js';
import { botVoiceSpeak } from '../widgets/chatBotSpeak';
import { newRematchRequest } from '../utilsOutpost';

export const botAcceptRematchOffer = (
  dispatch: DispatchOf<MatchActions>,
  delay = 1000
) => {
  const pathParts = window.location.pathname.split('/');
  const matchId = pathParts[pathParts.length - 1];
  setTimeout(() => {
    const handleRematch = async () => {
      const data = await newRematchRequest(matchId);

      dispatch({
        type: 'play:acceptOfferRematch',
        payload: {
          target_url: data.target_url,
          initiator_url: data.initiator_url,
        },
      });
    };
    handleRematch();
  }, delay);
};

export const botSendRematchOffer = (
  dispatch: DispatchOf<MatchActions>,
  byPlayerId: string,
  delay = 600,
  responseId?: string
) => {
  setTimeout(() => {
    setTimeout(() => {
      dispatch((masterContext) => ({
        type: 'play:sendOffer',
        payload: {
          byPlayer: byPlayerId,
          offerType: 'rematch',
          timestamp: masterContext.requestAt(),
        },
      }));
    }, 600);
    const contentList = [
      'One more round?',
      'Double or nothing? 😄',
      'Let’s play again!',
    ];
    const content = contentList[Math.floor(Math.random() * contentList.length)];

    dispatch({
      type: 'play:sendMessage',
      payload: {
        senderId: byPlayerId,
        content,
        timestamp: Date.now(),
        responseId: responseId,
      },
    });
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

  //   if(messages.length == 0){
  // const prompts = [
  //   `Hi! I’m your human chess bot ${activeBot.name}. Feel free to chat with me anytime.`,
  //   `Hey, I’m your human chess bot ${activeBot.name}. Let’s play and talk chess.`,
  //   `Hi there! I’m your human chess bot ${activeBot.name}... you can talk to me here anytime.`,
  //   `Welcome! I’m your human chess bot ${activeBot.name}. Ask me anything or just play.`,
  //   `Hey! I’m your human chess bot ${activeBot.name}. Let’s enjoy some chess together.`
  // ];

  // const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  //      dispatch({
  //         type: 'play:sendMessage',
  //         payload: {
  //           senderId: activeBot.id,
  //           content: prompt,
  //           timestamp: Date.now(),
  //         },

  //   })
  // }
  if (messages.length == 0 && pgn.length > 15 && pgn.length < 19) {
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
      'say hello and give me an interesting opinion about the opening based on the move we played ' +
      UciFormat;

    const sendMessage = async () => {
      const content = await ChatBotWidget(
        prompt,
        pgn,
        messages,
        activeBot.name,
        botColor,
        UciFormat
      );
      if (content == 'ai_daily_limit_reached') {
        return;
      }

      //  botVoiceSpeak( content.answer.text,activeBot.name)

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
