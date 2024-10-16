import { useTheme } from 'apps/chessroulette-web/hooks/useTheme';

// TODO: This will be able to get the theme from the user settings or local storage in the future
export const useBoardTheme = () => useTheme().board;
