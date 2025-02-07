import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	integer,
	boolean,
	index,
	uniqueIndex,
	type AnyPgColumn,
	unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Add this BEFORE table definitions
export const pgTrigram = sql.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	articlesCount: integer('articles_count').default(0).notNull(),
	revisionCount: integer('revision_count').default(0).notNull(),
	isAdmin: boolean('is_admin').default(false).notNull(),
	isBanned: boolean('is_banned').default(false).notNull(),
	bannedAt: timestamp('banned_at'),
	bannedBy: text('banned_by').references((): any => user.id)
}, (table) => ({
	emailIdx: uniqueIndex("user_email_idx").on(table.email),
	createdAtIndex: index("user_created_at_idx").on(table.createdAt),
	bannedStatusIdx: index("user_banned_status_idx")
		.on(table.isBanned, table.bannedAt),
	adminIdx: index("user_admin_idx").on(table.isAdmin),
	bannedByIdx: index("user_banned_by_idx").on(table.bannedBy),
}));

export const articles = pgTable("articles", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	content: text("content").notNull(),
	current_revision: uuid("current_revision").references((): AnyPgColumn => revisions.id, { onDelete: "set null" }),
	created_by: text("created_by").notNull().references(() => user.id),
	created_at: timestamp("created_at").defaultNow().notNull(),
	updated_at: timestamp("updated_at").defaultNow().notNull(),
	search_vector: text("search_vector").notNull().default(''),
	search_content: text("search_content").notNull().default(''),
	revisionCount: integer("revision_count").default(0).notNull(),
}, (table) => {
	return {
		creator_idx: index("articles_creator_idx").using("btree", table.created_by, table.created_at),
		revision_idx: index("articles_revision_idx").using("btree", table.current_revision),
		slug_idx: uniqueIndex("articles_slug_idx").using("btree", table.slug),
		title_idx: index("articles_title_idx").using("btree", table.title),
		articles_slug_unique: unique("articles_slug_unique").on(table.slug),
		revisionCountIdx: index("articles_revision_count_idx").on(table.revisionCount),
	}
});

export const revisions = pgTable('revisions', {
	id: uuid('id').defaultRandom().primaryKey(),
	articleId: uuid('article_id').references(() => articles.id).notNull(),
	content: text('content').notNull(),
	wordChanged: varchar('word_changed', { length: 255 }).notNull(),
	wordIndex: integer('word_index').notNull(),
	createdBy: text('created_by')
		.references(() => user.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
	articleIdx: index("revisions_article_idx")
		.on(table.articleId, table.createdAt.desc()),
	creatorIdx: index("revisions_creator_idx").on(table.createdBy),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
}, (table) => ({
	userSessionIdx: index("session_user_idx")
		.on(table.userId, table.expiresAt),
	tokenIdx: uniqueIndex("session_token_idx").on(table.token),
}));

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, {
		onDelete: 'cascade'
	}),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
	providerAccountIdx: uniqueIndex("account_provider_unique")
		.on(table.providerId, table.accountId),
	userAccountsIdx: index("account_user_idx")
		.on(table.userId, table.providerId),
}));

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
}, (table) => ({
	verificationIdx: uniqueIndex("verification_identifier_value")
		.on(table.identifier, table.value),
	expiryIdx: index("verification_expiry_idx").on(table.expiresAt),
}));

export const authTokens = pgTable('auth_tokens', {
	token: varchar('token', { length: 32 }).primaryKey(),
	userId: text('user_id')
		.references(() => user.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	ip: text('ip').notNull(),
	userAgent: text('user_agent').notNull()
}, (table) => ({
	userTokenIdx: index("auth_tokens_user_idx")
		.on(table.userId, table.expiresAt),
}));

// relations
export const articlesRelations = relations(articles, ({ many }) => ({
	revisions: many(revisions)
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
	article: one(articles, {
		fields: [revisions.articleId],
		references: [articles.id]
	}),
	creator: one(user, {
		fields: [revisions.createdBy],
		references: [user.id]
	})
}));

export const usersRelations = relations(user, ({ many, one }) => ({
	revisions: many(revisions),
	bannedByUser: one(user, {
		fields: [user.bannedBy],
		references: [user.id]
	})
}));

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;