import { Action } from 'movex-core-util';
import activityReducer, {
  ActivityActions,
  ActivityState,
} from '../activity/reducer';
import { User } from '../../user/type';

// export const userSlots = {
//   pink: true,
//   red: true,
//   blue: true,
//   purple: true,
//   green: true,
//   orange: true,
// };

// export type UserSlot = keyof typeof userSlots;

// export type ChatMsg = {
//   content: string;
//   atTimestamp: number;
//   userSlot: UserSlot;
// };

type ParticipantId = string;

export type RoomState = {
  // userSlots: {
  //   [slot in UserSlot]: boolean;
  // };
  participants: Record<User['id'], { userId: User['id'] }>;
  activity: ActivityState;
  counter: number;
  // messages: ChatMsg[];
};

export const initialRoomState: RoomState = {
  participants: {},
  activity: {
    activityType: 'none',
    activityState: {},
  },
  counter: 0,
  // messages: [],
};

// PART 2: Action Types

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
  // | Action<'inc'>
  | ActivityActions;
// | Action<
//     'submit',
//     {
//       userSlot: UserSlot;
//       content: string;
//       atTimestamp: number;
//     }
//   >;

// PART 3: The Reducer – This is where all the logic happens

export default (state = initialRoomState, action: RoomActions): RoomState => {
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

  // else if (action.type === 'inc') {
  //   return {
  //     ...state,
  //     counter: state.counter + 1,
  //   };
  // }

  // // Message gets submitted
  // else if (action.type === 'submit') {
  //   const nextMsg = action.payload;

  //   return {
  //     ...state,
  //     messages: [...state.messages, nextMsg],
  //   };
  // }

  // TODO: This should be done differently!
  if (action.type === 'dropPiece') {
    // console.log('heere')
    return {
      ...state,
      activity: activityReducer(state.activity, action),
    };
  }

  return state;
};
