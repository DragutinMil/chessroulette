import { reducer as roomReducer } from './modules/room/movex/reducer';
import { config } from './config';
import { reducerLogger } from './lib/util';

console.log('roomReducer', roomReducer);
console.log('roomReducer $tr', roomReducer.$transformState);

export default {
  resources: {
    room: roomReducer,
    // room: config.DEBUG_MODE
    //   ? reducerLogger(roomReducer, 'Room Movex')
    //   : roomReducer,
  },
};
