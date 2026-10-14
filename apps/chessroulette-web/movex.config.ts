import { reducer as roomReducer } from '@app/modules/Room/movex';
import { config } from './config';
import { reducerLogger, safeReducer } from './lib/util';

export default {
  resources: {
    // room: roomReducer,
    // room: reducerLogger(roomReducer, 'Room Movex'),//
    room: safeReducer(
      config.DEBUG_MODE
        ? reducerLogger(roomReducer, 'Room Movex')
        : roomReducer,
      'Room Movex'
    ),
  },
};
