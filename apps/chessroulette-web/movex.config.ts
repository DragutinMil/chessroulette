import { reducer as roomReducer } from '@app/modules/Room/movex';
import { config } from './config';
import { chatResource } from '@app/modules/Match/movex/chat/chatMovex'
import { reducerLogger } from './lib/util';

export default {
  resources: {
    // room: roomReducer,
    // room: reducerLogger(roomReducer, 'Room Movex'),
    room: config.DEBUG_MODE
      ? reducerLogger(roomReducer, 'Room Movex')
      : roomReducer,
    chat: config.DEBUG_MODE
      ? reducerLogger(chatResource.reducer, 'Chat Movex')
      : chatResource.reducer,  
  },
};
