import Link from 'next/link';
import { LessonModel } from '../types';
import { LessonItem } from './LessonItem';
import { learnRoutes } from '../links';

type Props = {
  lessons: LessonModel[];
};

export const LessonsList = ({ lessons }: Props) => {
  return (
    <div className="">
      <header className="pb-4">
        <div className="text-white">Lessons ({lessons.length})</div>
      </header>
      <div className="flex gap-4">
        {lessons.map((lesson) => (
          // <div id={lesson.id} key={lesson.id}>
          //   {lesson.name}

          //   <pre>{JSON.stringify(lesson, null, 2)}</pre>
          // </div>
          <Link key={lesson.id} href={learnRoutes.newLesson(lesson.id)} className="w-1/4 block">
            <LessonItem key={lesson.id} lesson={lesson} />
          </Link>
        ))}
      </div>
    </div>
  );
};
