CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"current_revision" uuid,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"search_vector" text DEFAULT '' NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_tokens" (
	"token" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip" text NOT NULL,
	"user_agent" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"content" text NOT NULL,
	"word_changed" varchar(255) NOT NULL,
	"word_index" integer NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"articles_count" integer DEFAULT 0 NOT NULL,
	"revision_count" integer DEFAULT 0 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp,
	"banned_by" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "articles" ADD CONSTRAINT "articles_current_revision_revisions_id_fk" FOREIGN KEY ("current_revision") REFERENCES "public"."revisions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revisions" ADD CONSTRAINT "revisions_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revisions" ADD CONSTRAINT "revisions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_banned_by_user_id_fk" FOREIGN KEY ("banned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_idx" ON "account" USING btree ("user_id","provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_creator_idx" ON "articles" USING btree ("created_by","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_revision_idx" ON "articles" USING btree ("current_revision");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_title_idx" ON "articles" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_tokens_user_idx" ON "auth_tokens" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revisions_article_idx" ON "revisions" USING btree ("article_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revisions_creator_idx" ON "revisions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "session" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_created_at_idx" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_banned_status_idx" ON "user" USING btree ("is_banned","banned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_admin_idx" ON "user" USING btree ("is_admin");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_banned_by_idx" ON "user" USING btree ("banned_by");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verification_identifier_value" ON "verification" USING btree ("identifier","value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_expiry_idx" ON "verification" USING btree ("expires_at");

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop the old column and add new one
ALTER TABLE articles DROP COLUMN IF EXISTS search_vector;
ALTER TABLE articles ADD COLUMN search_vector tsvector DEFAULT to_tsvector('english', '');

-- Create indexes
DROP INDEX IF EXISTS articles_title_trgm_idx;
DROP INDEX IF EXISTS articles_search_vector_idx;
CREATE INDEX articles_title_trgm_idx ON articles USING gin(title gin_trgm_ops);
CREATE INDEX articles_search_vector_idx ON articles USING gin(search_vector);

-- Update existing rows
UPDATE articles SET search_vector = to_tsvector('english', coalesce(title, ''));

-- Create trigger function
CREATE OR REPLACE FUNCTION articles_search_vector_trigger() RETURNS trigger AS $$
begin
    new.search_vector := to_tsvector('english', coalesce(new.title, ''));
    return new;
end
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS articles_search_vector_update ON articles;
CREATE TRIGGER articles_search_vector_update
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION articles_search_vector_trigger();