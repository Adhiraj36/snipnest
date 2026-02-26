import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey(),
  user_id: varchar("user_id").default(""),
  name: varchar("name").default(""),
  title: varchar("title").default(""),
  content: varchar("content").default(""),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});
