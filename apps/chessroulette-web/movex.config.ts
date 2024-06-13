import { AnyAction, MovexReducer } from 'movex-core-util';
import roomReducer from './modules/room/movex/reducer';
import { config } from './config';

const reducerLogger = <S, A extends AnyAction>(
  reducer: MovexReducer<S, A>,
  name = ''
) => {
  console.group(`${name} Reducer Logger Init State`);
  console.log(reducer(undefined as S, { type: '_init' } as A));
  console.groupEnd();

  return (s: S, a: A) => {
    const next = reducer(s, a);

    // TODO: Move this here in a logger middleware
    console.group(`${name} Movex Action:`, a.type);
    console.log('Payload:', (a as any).payload);
    console.log('Prev:', s);
    console.log('Next:', next);
    console.groupEnd();

    return next;
  };
};

export default {
  resources: {
    room: config.DEBUG_MODE ? reducerLogger(roomReducer, 'Room') : roomReducer,
  },
};
