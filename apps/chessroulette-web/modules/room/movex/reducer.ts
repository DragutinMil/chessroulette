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
  console.group('Movex Room Reducer: Action', action.type);
  console.log('payload', (action as any).payload);
  console.log('prev', state);
  // console.log('next', next);
  console.log('');
  console.groupEnd();

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

  // TODO: This should be done differently!
  if (
    action.type === 'createChapter' ||
    action.type === 'deleteChapter' ||
    action.type === 'updateChapter' ||
    action.type === 'loadChapter' ||
    action.type === 'loadedChapter:addMove' ||
    action.type === 'loadedChapter:focusHistoryIndex' ||
    action.type === 'loadedChapter:deleteHistoryMove' ||
    action.type === 'loadedChapter:clearCircles' ||
    action.type === 'loadedChapter:drawCircle' ||
    action.type === 'loadedChapter:setArrows' ||
    action.type === 'loadedChapter:setOrientation' ||
    action.type === 'loadedChapter:updateFen'
  ) {
    // console.log('heere')
    return {
      ...state,
      activity: activityReducer(state.activity, action),
    };
  }

  return state;
};
