import { useTheme } from 'apps/chessroulette-web/hooks/useTheme/useTheme'

export const useBoardTheme = () => {
  // TODO: This will be able to get the theme from the user settings or local storage in the future

  return useTheme().board;
}