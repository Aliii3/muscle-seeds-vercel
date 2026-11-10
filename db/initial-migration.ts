// Generated from migrations/0001_initial.sql; checksum is shared with the CLI migration ledger.
export const initialMigration={
  "name": "0001_initial.sql",
  "checksum": "7a71e62f6ef7e5866ad63e876e90173f7db4d5ae193912ee8d4eac523dbee2c4",
  "statements": [
    "CREATE TABLE `creators` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`email` text NOT NULL,\n\t`user_id` text,\n\t`code` text NOT NULL,\n\t`created_at` text NOT NULL\n);",
    "CREATE UNIQUE INDEX `creators_email_unique` ON `creators` (`email`);",
    "CREATE UNIQUE INDEX `creators_user_id_unique` ON `creators` (`user_id`);",
    "CREATE UNIQUE INDEX `creators_code_unique` ON `creators` (`code`);",
    "CREATE TABLE `orders` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`created_at` text NOT NULL,\n\t`updated_at` text NOT NULL,\n\t`codes` text NOT NULL,\n\t`status` text NOT NULL,\n\t`cancelled_at` text,\n\t`test` integer DEFAULT false NOT NULL,\n\t`collected` integer NOT NULL,\n\t`refunded` integer NOT NULL,\n\t`currency` text NOT NULL\n);",
    "CREATE TABLE `settings` (\n\t`id` integer PRIMARY KEY NOT NULL,\n\t`owner_id` text NOT NULL,\n\t`domain` text,\n\t`credential` text,\n\t`auth_mode` text,\n\t`currency` text DEFAULT 'EGP' NOT NULL,\n\t`last_sync` text,\n\t`sync_cursor` text,\n\t`sync_started` text,\n\t`sync_lock` integer\n);"
  ]
};
