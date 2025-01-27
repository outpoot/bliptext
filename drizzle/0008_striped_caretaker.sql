CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_idx" ON "account" USING btree ("user_id","provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_creator_idx" ON "articles" USING btree ("created_by","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_revision_idx" ON "articles" USING btree ("current_revision");--> statement-breakpoint
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