ALTER TABLE "articles" DROP CONSTRAINT "articles_current_revision_revisions_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "articles" ADD CONSTRAINT "articles_current_revision_revisions_id_fk" FOREIGN KEY ("current_revision") REFERENCES "public"."revisions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
