'use client';

import { LessonEditorView } from './LessonEditor/LessonEditorView';
import { LessonModel } from './types';
import {
  lessonModelToLessonState,
  lessonStateToLessonCreateInput,
} from './util';

type Props = {
  lesson: LessonModel;
};

export const UpdateLessonContainer = ({ lesson }: Props) => {
  const lessonState = lessonModelToLessonState(lesson);

  return (
    <LessonEditorView
      state={lessonState}
      onCommit={(draft) => {
        console.log(
          'committing draft state',
          draft,
          'to input',
          lessonStateToLessonCreateInput(draft)
        );
      }}
    />
  );
};
