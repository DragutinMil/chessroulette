import { useContext } from 'react';
import { MatchStateContext } from '../providers/MatchStateContext';

export const useMatch = () => useContext(MatchStateContext);
