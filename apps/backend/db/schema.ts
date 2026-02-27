import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  user_id: text("user_id").default(""),
  name: text("name").default(""),
  title: text("title").default(""),
  content: text("content").default(""),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const mentorSessions = pgTable('mentor_sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  interest_id: text('interest_id').notNull(),
  sub_domain_id: text('sub_domain_id').notNull(),
  topic_id: text('topic_id').notNull(),
  theory_content: text('theory_content').notNull().default(''),
  current_question_index: integer('current_question_index').notNull().default(0),
  points_earned: integer('points_earned').notNull().default(0),
  status: text('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const mentorQuestions = pgTable('mentor_questions', {
  id: text('id').primaryKey(),
  session_id: text('session_id').notNull(),
  user_id: text('user_id').notNull(),
  interest_id: text('interest_id').notNull(),
  sub_domain_id: text('sub_domain_id').notNull(),
  topic_id: text('topic_id').notNull(),
  question_index: integer('question_index').notNull(),
  prompt: text('prompt').notNull(),
  starter_code: text('starter_code').notNull().default(''),
  test_input: text('test_input').notNull().default(''),
  expected_output: text('expected_output').notNull().default(''),
  explanation: text('explanation').notNull().default(''),
  difficulty: text('difficulty').notNull().default('easy'),
  question_type: text('question_type').notNull().default('code'),
  max_points: integer('max_points').notNull().default(10),
  created_at: timestamp('created_at').defaultNow(),
});

export const questionAttempts = pgTable('question_attempts', {
  id: text('id').primaryKey(),
  question_id: text('question_id').notNull(),
  session_id: text('session_id').notNull(),
  user_id: text('user_id').notNull(),
  submitted_code: text('submitted_code').notNull().default(''),
  judge0_status: text('judge0_status').notNull().default('generated'),
  stdout: text('stdout').notNull().default(''),
  stderr: text('stderr').notNull().default(''),
  score: integer('score').notNull().default(0),
  llm_feedback: text('llm_feedback').notNull().default(''),
  created_at: timestamp('created_at').defaultNow(),
});
