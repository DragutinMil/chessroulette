import { useContext } from 'react';
import { GameActionsContext } from './GameActionsContext';

export const useGameActions = () => useContext(GameActionsContext);
