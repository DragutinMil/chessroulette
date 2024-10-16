import { reducer as roomReducer } from '@app/modules/room/movex';
import { config } from './config';
import { reducerLogger } from './lib/util';

export default {
  resources: {
    room: roomReducer,
    // room: config.DEBUG_MODE
    //   ? reducerLogger(roomReducer, 'Room Movex')
    //   : roomReducer,
  },
};
