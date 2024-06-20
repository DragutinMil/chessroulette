// const root = '/';
const learn = '/learn';
const lessons = `${learn}/lessons`;

export const learnRoutes = {
  learn,
  lessons,
  newLesson(id: string) {
    return `${lessons}/${id}`;
  },
};
