import React from 'react';
import {
  DailyLessonWidgetPanel,
  DailyLessonWidgetPanelProps,
} from './DailyLessonWidgetPanel';

export type WidgetPanelProps = DailyLessonWidgetPanelProps;

export const WidgetPanel = (props: WidgetPanelProps) => (
  <DailyLessonWidgetPanel {...props} />
);
