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

export type MentorDifficulty = 'easy' | 'medium' | 'hard';

export type MentorQuestionType = 'mcq' | 'code';

export type InterestTopic = {
  id: string;
  name: string;
};

export type InterestSubDomain = {
  id: string;
  name: string;
  topics: InterestTopic[];
};

export type InterestDomain = {
  id: string;
  name: string;
  language: string;
  judge0LanguageId: number;
  subDomains: InterestSubDomain[];
};

export type MentorSession = {
  id: string;
  user_id: string;
  interest_id: string;
  sub_domain_id: string;
  topic_id: string;
  theory_content: string;
  current_question_index: number;
  points_earned: number;
  status: 'active' | 'completed';
  created_at: Date;
  updated_at: Date;
};

export type MentorQuestion = {
  id: string;
  session_id: string;
  user_id: string;
  interest_id: string;
  sub_domain_id: string;
  topic_id: string;
  question_index: number;
  prompt: string;
  starter_code: string;
  test_input: string;
  expected_output: string;
  explanation: string;
  difficulty: MentorDifficulty;
  question_type: MentorQuestionType;
  max_points: number;
  created_at: Date;
};

export type QuestionAttempt = {
  id: string;
  question_id: string;
  session_id: string;
  user_id: string;
  submitted_code: string;
  judge0_status: string;
  stdout: string;
  stderr: string;
  score: number;
  llm_feedback: string;
  created_at: Date;
};