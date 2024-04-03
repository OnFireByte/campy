import { bigint, boolean, date, index, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable(
    "users",
    {
        id: bigint("id", {
            mode: "number",
        })
            .autoincrement()
            .notNull()
            .primaryKey(),
        name: text("name").notNull(),
        email: varchar("email", { length: 64 }).notNull().unique(),
        password: text("password").notNull(),
        telephoneNumber: text("telephone_number").notNull(),
        verified: boolean("verified").notNull().default(false),
        role: text("role", {
            enum: ["admin", "user"],
        })
            .notNull()
            .default("user"),
    },
    (table) => ({
        emailIdx: index("email_idx").on(table.email),
    })
);

export const emailVerifications = mysqlTable(
    "email_verifications",
    {
        id: bigint("id", {
            mode: "number",
        })
            .autoincrement()
            .notNull()
            .primaryKey(),
        token: varchar("token", {
            length: 64,
        }).notNull(),
        userID: bigint("user_id", { mode: "number" })
            .notNull()
            .references(() => users.id),
    },
    (table) => ({
        tokenIdx: index("token_idx").on(table.token),
        userIdx: index("user_idx").on(table.userID),
    })
);

export const campgrounds = mysqlTable("campground", {
    id: bigint("id", {
        mode: "number",
    })
        .autoincrement()
        .notNull()
        .primaryKey(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    telephoneNumber: text("telephone_number").notNull(),
});

export const bookings = mysqlTable("bookings", {
    id: bigint("id", {
        mode: "number",
    })
        .autoincrement()
        .notNull()
        .primaryKey(),
    userID: bigint("user_id", { mode: "number" })
        .notNull()
        .references(() => users.id),
    campgroundID: bigint("campground_id", { mode: "number" })
        .notNull()
        .references(() => campgrounds.id),
    date: date("date").notNull(),
});
