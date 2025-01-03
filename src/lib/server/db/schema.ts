import { pgTable, text, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { relations, type Relation } from 'drizzle-orm';

export const articles = pgTable('articles', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	content: varchar('content', { length: 100_000 }).notNull(),
	currentRevision: uuid('current_revision').references((): any => revisions.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const revisions = pgTable('revisions', {
	id: uuid('id').defaultRandom().primaryKey(),
	articleId: uuid('article_id').references(() => articles.id).notNull(),
	content: text('content').notNull(),
	wordChanged: varchar('word_changed', { length: 255 }).notNull(),
	wordIndex: integer('word_index').notNull(),
	createdBy: varchar('created_by', { length: 255 }).notNull(), // IP address or user ID
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Add relations
export const articlesRelations = relations(articles, ({ many }) => ({
	revisions: many(revisions)
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
	article: one(articles, {
		fields: [revisions.articleId],
		references: [articles.id]
	})
}));

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;