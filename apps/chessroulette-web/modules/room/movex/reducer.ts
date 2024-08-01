import { MovexReducer } from 'movex-core-util';
import {
  ActivityActions,
  ActivityState,
  initialActivityState,
  roomActivityReducer,
} from '../activities/movex';

export type RoomState = {
  activity: ActivityState;
};

export const initialRoomState: RoomState = {
  activity: initialActivityState,
};

export type RoomActions = ActivityActions;

const roomReducer: MovexReducer<RoomState, RoomActions> = (
  state = initialRoomState,
  action: RoomActions
): RoomState => {
  // This does nothing for now
  return state;
};

export const reducer: MovexReducer<RoomState, RoomActions> = (
  state = initialRoomState,
  action: RoomActions
): RoomState => {
  const nextRoomState = roomReducer(state, action);

  return {
    // ...nextRoomState, // TODO: Bring back once it is updayeable
    activity: roomActivityReducer(
      nextRoomState.activity,
      action as ActivityActions
    ),
  };
};

reducer.$transformState = (state, masterContext) => ({
  ...state,
  // HACK: Apply the roomActivityReducer.$transformState
  // TODO: Ths is a hack, because of the way I designed the reducers, all nested into the Room,
  //  but this can be avoided with a better design!
  ...(roomActivityReducer.$transformState && {
    activity: roomActivityReducer.$transformState(
      state.activity,
      masterContext
    ),
  }),
});
