export type Notes = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
};

export type UserClaims = {
  id: string;
};