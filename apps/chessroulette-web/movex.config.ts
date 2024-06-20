import roomReducer from './modules/room/movex/reducer';
import { config } from './config';
import { reducerLogger } from './lib/util';

export default {
  resources: {
    room: config.DEBUG_MODE
      ? reducerLogger(roomReducer, 'Room Movex')
      : roomReducer,
  },
};
