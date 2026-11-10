import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const settings = sqliteTable("settings", {
 id: integer("id").primaryKey(), ownerId: text("owner_id").notNull(),
 domain: text("domain"), credential: text("credential"), authMode: text("auth_mode"),
 currency: text("currency").notNull().default("EGP"), lastSync: text("last_sync"),
 syncCursor: text("sync_cursor"), syncStarted: text("sync_started"), syncLock: integer("sync_lock"),
});
export const creators = sqliteTable("creators", {
 id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
 userId: text("user_id").unique(), code: text("code").notNull().unique(), createdAt: text("created_at").notNull(),
});
export const orders = sqliteTable("orders", {
 id: text("id").primaryKey(), name: text("name").notNull(), createdAt: text("created_at").notNull(),
 updatedAt: text("updated_at").notNull(), codes: text("codes").notNull(), status: text("status").notNull(),
 cancelledAt: text("cancelled_at"), test: integer("test", {mode:"boolean"}).notNull().default(false),
 collected: integer("collected").notNull(), refunded: integer("refunded").notNull(), currency: text("currency").notNull(),
});
