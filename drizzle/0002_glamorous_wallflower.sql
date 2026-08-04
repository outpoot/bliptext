DROP INDEX "articles_slug_idx";--> statement-breakpoint
DROP INDEX "session_token_idx";--> statement-breakpoint
DROP INDEX "user_email_idx";--> statement-breakpoint
DROP INDEX "revisions_creator_idx";--> statement-breakpoint
CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "session_ip_user_idx" ON "session" USING btree ("ip_address","user_id") WHERE "session"."ip_address" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "user" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_leaderboard_idx" ON "user" USING btree ("revision_count" DESC NULLS LAST) WHERE "user"."is_banned" = false;--> statement-breakpoint
CREATE INDEX "revisions_creator_idx" ON "revisions" USING btree ("created_by","created_at" DESC NULLS LAST);