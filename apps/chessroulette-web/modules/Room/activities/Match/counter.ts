// @app/modules/MatchActivity/counter.ts
import { Action } from 'movex-core-util'; // prilagodi putanju ako je drugačija

// Tip za stanje brojača
export type CounterState = {
  count: number;
};

// Inicijalno stanje
export const initialCounterState: CounterState = {
  count: 0,
};

// Tipovi akcija
export type CounterActions =
  | Action<'increment'>
  | Action<'decrement'>
  | Action<'change', number>
  | Action<'incrementBy', number>;

// Reducer funkcija
const counterReducer = (
  state: CounterState = initialCounterState,
  action: CounterActions
): CounterState => {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };

    case 'decrement':
      return { ...state, count: state.count - 1 };

    case 'incrementBy':
      return { ...state, count: state.count + action.payload };

    case 'change':
      return { ...state, count: action.payload };

    default:
      return state;
  }
};

export default counterReducer;
