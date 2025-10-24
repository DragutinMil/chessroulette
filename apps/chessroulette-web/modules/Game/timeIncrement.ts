import { GameTimeClass } from './io';

export const getTimeIncrement = (timeClass: GameTimeClass): number => {
  switch (timeClass) {
    case 'bulletplus1':
      return 1000; // 1 second in milliseconds
    case 'bullet2plus1':
      return 1000;
    case 'blitz3plus2':
      return 2000; // 2 seconds in milliseconds
      case 'blitzplus2':
        return 2000; // 2 seconds in milliseconds
    default:
      return 0;
  }
};