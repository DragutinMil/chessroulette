export type User = {
  id: string;
  displayName?: string;
  rating?: string;
};

export type UserId = User['id'];

export type UsersMap = Record<User['id'], User>;
