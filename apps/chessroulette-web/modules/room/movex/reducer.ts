import { Action } from 'movex-core-util';
import { User } from '../../user/type';
import { LearnActivityActions } from '../activities/Learn/movex';
import { ActivityState, roomActivityReducer } from '../activities/movex';

export type RoomState = {
  participants: Record<User['id'], { userId: User['id'] }>;
  activity: ActivityState;
};

export const initialRoomState: RoomState = {
  participants: {},
  activity: {
    activityType: 'none',
    activityState: {},
  },
};

export type RoomActions =
  | Action<
      'join',
      {
        userId: User['id'];
      }
    >
  | Action<
      'leave',
      {
        userId: User['id'];
      }
    >
  | LearnActivityActions;

const roomReducer = (
  state = initialRoomState,
  action: RoomActions
): RoomState => {
  // User Joins
  if (action.type === 'join') {
    return {
      ...state,
      participants: {
        ...state.participants,
        [action.payload.userId]: action.payload,
      },
    };
  }
  // User Leaves
  else if (action.type === 'leave') {
    const { [action.payload.userId]: _, ...nextParticipants } =
      state.participants;

    return {
      ...state,
      participants: nextParticipants,
    };
  }

  return state;
};

export default (state = initialRoomState, action: RoomActions): RoomState => {
  const nextRoomState = roomReducer(state, action);

  return {
    ...nextRoomState,
    activity: roomActivityReducer(
      nextRoomState.activity,
      action as LearnActivityActions
    ),
  };
};
