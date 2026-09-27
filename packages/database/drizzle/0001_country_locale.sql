ALTER TABLE "countries" ADD COLUMN "locale" text DEFAULT 'uk-UA' NOT NULL;--> statement-breakpoint
UPDATE "countries" SET "iso" = 'UA' WHERE "iso" = 'UK';
