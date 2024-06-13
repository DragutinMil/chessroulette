import { useContext } from 'react';
import { GameActionsContext } from './GameActionsContext';

export const useGameActionsContext = () => useContext(GameActionsContext);
