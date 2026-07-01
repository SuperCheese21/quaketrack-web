CREATE TABLE "notified_earthquakes" (
	"earthquake_id" text PRIMARY KEY NOT NULL,
	"mag" double precision NOT NULL,
	"updated_time" bigint,
	"notified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"min_magnitude" double precision DEFAULT 5 NOT NULL,
	"updates" boolean DEFAULT false NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_endpoint_unique" UNIQUE("endpoint")
);
