import React from 'react';
import Link from 'next/link';
import { Icon } from '@app/components/Icon/Icon';
import { links } from '../Room/links';
import {
  LESSON_DATABASE,
  Lesson,
} from '../Room/activities/DailyLesson/lessonDatabase';

const LEVEL_LABELS: Record<Lesson['level'], string> = {
  1: 'Level 1 — Pieces',
  2: 'Level 2',
  3: 'Level 3',
};

const groupByLevel = (lessons: Lesson[]) => {
  const byLevel = new Map<Lesson['level'], Lesson[]>();
  for (const lesson of lessons) {
    const list = byLevel.get(lesson.level) ?? [];
    list.push(lesson);
    byLevel.set(lesson.level, list);
  }
  for (const list of byLevel.values()) list.sort((a, b) => a.day - b.day);
  return [...byLevel.entries()].sort(([a], [b]) => a - b);
};

export const DailyLessonsSection: React.FC = () => {
  const levels = groupByLevel(LESSON_DATABASE);

  return (
    <main
      className="flex flex-1 justify-center
        pl-[max(env(safe-area-inset-left),1.5rem)]
        pr-[max(env(safe-area-inset-right),1.5rem)]"
    >
      <div className="flex flex-col gap-10 py-10 w-full max-w-3xl">
        <div className="text-center md:text-left">
          <h2 className="font-black text-4xl sm:text-5xl mb-2">Lessons</h2>
          <p className="text-lg text-slate-400">
            Short, interactive lessons — a few minutes a day.
          </p>
        </div>

        {levels.map(([level, lessons]) => (
          <div key={level} className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {LEVEL_LABELS[level] ?? `Level ${level}`}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={links.getOnDemandRoomCreationLink({
                    activity: 'dailylesson',
                    lessonId: lesson.id,
                    theme: 'op',
                  })}
                  className="flex items-center gap-4 rounded-lg border border-conversation-100 bg-op-widget px-5 py-4 hover:border-conversation-300 transition-colors"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#07DA63]/15 text-[#07DA63]">
                    <Icon name="PlayIcon" kind="solid" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Day {lesson.day}</p>
                    <p className="font-bold truncate">{lesson.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
