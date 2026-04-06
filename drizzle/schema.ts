import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, timestamp, unique } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const sessions = mysqlTable("sessions", {
	id: int().autoincrement().notNull(),
	token: varchar({ length: 255 }).notNull(),
	userId: int("user_id").default('NULL'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
},
(table) => [
	unique("users_email_unique").on(table.email),
]);
