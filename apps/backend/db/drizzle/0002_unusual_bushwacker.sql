CREATE TABLE "mentor_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"interest_id" text NOT NULL,
	"sub_domain_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"question_index" integer NOT NULL,
	"prompt" text NOT NULL,
	"starter_code" text DEFAULT '' NOT NULL,
	"test_input" text DEFAULT '' NOT NULL,
	"expected_output" text DEFAULT '' NOT NULL,
	"explanation" text DEFAULT '' NOT NULL,
	"difficulty" text DEFAULT 'easy' NOT NULL,
	"question_type" text DEFAULT 'code' NOT NULL,
	"max_points" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mentor_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"interest_id" text NOT NULL,
	"sub_domain_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"theory_content" text DEFAULT '' NOT NULL,
	"current_question_index" integer DEFAULT 0 NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"submitted_code" text DEFAULT '' NOT NULL,
	"judge0_status" text DEFAULT 'generated' NOT NULL,
	"stdout" text DEFAULT '' NOT NULL,
	"stderr" text DEFAULT '' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"llm_feedback" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "user_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "title" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "content" SET DEFAULT '';