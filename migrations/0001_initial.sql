CREATE TABLE `creators` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`code` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creators_email_unique` ON `creators` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `creators_user_id_unique` ON `creators` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `creators_code_unique` ON `creators` (`code`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`codes` text NOT NULL,
	`status` text NOT NULL,
	`cancelled_at` text,
	`test` integer DEFAULT false NOT NULL,
	`collected` integer NOT NULL,
	`refunded` integer NOT NULL,
	`currency` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`domain` text,
	`credential` text,
	`auth_mode` text,
	`currency` text DEFAULT 'EGP' NOT NULL,
	`last_sync` text,
	`sync_cursor` text,
	`sync_started` text,
	`sync_lock` integer
);
