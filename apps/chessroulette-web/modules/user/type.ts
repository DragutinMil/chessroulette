export type User = {
  id: string;
};

export type UserId = User['id'];

export type UsersMap = Record<User['id'], { userId: User['id'] }>;
