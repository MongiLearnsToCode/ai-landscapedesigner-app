CREATE TABLE "landscape_redesigns" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"original_image_url" text NOT NULL,
	"redesigned_image_url" text NOT NULL,
	"design_catalog" json NOT NULL,
	"styles" json NOT NULL,
	"climate_zone" text,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
