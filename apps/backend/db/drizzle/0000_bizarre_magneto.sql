CREATE TABLE "notes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar DEFAULT '',
	"title" varchar DEFAULT '',
	"content" varchar DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
