import { useContext } from 'react';
import { MatchStateContext,MatchRematchContext } from '../providers/MatchContext';
import { MatchViewState } from '../types';

export const useMatchViewState = (): MatchViewState =>
  useContext(MatchStateContext);

export const useMatchActionsDispatch = () =>
  useContext(MatchStateContext).dispatch;

export const useRematchDispatch = () =>
  useContext(MatchRematchContext).dispatch;