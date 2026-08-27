import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

// projects
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

// roadmap_items
export const roadmapItems = sqliteTable("roadmap_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["backlog", "next_up", "in_progress", "done"] })
    .notNull()
    .default("backlog"),
  projectId: text("project_id"),
  votes: integer("votes").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// vote_requests
export const voteRequests = sqliteTable("vote_requests", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: text("user_id").notNull(),
  votes: integer("votes").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

// votes
export const votes = sqliteTable(
  "votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    targetType: text("target_type", { enum: ["roadmap", "vote_request"] }).notNull(),
    targetId: text("target_id").notNull(),
    createdAt: text("created_at").notNull().default(""),
  },
  (table) => [
    uniqueIndex("unique_vote").on(table.userId, table.targetType, table.targetId),
  ]
);
