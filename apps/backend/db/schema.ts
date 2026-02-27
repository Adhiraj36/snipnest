import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  user_id: text("user_id").default(""),
  name: text("name").default(""),
  title: text("title").default(""),
  content: text("content").default(""),
  created_at: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updated_at: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch())`)
});
