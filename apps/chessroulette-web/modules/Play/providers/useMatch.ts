import { useContext } from 'react';
import { MatchStateContext } from './MatchStateContext';

export const useMatch = () => useContext(MatchStateContext);
