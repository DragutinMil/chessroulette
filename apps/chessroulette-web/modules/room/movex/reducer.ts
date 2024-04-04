import { Action } from 'movex-core-util';
import { User } from '../../user/type';
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

const roomReducer = (
  state = initialRoomState,
  action: RoomActions
): RoomState => {
  // This does nothing for now
  return state;
};

export default (state = initialRoomState, action: RoomActions): RoomState => {
  const nextRoomState = roomReducer(state, action);

  return {
    // ...nextRoomState,
    activity: roomActivityReducer(
      nextRoomState.activity,
      action as ActivityActions
    ),
  };
};
