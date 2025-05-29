import { useToken} from '@app/hooks/useToken';

// TODO: This will be able to get the theme from the user settings or local storage in the future
export const useTokenCheck = () => useToken();