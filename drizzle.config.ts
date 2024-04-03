import type { Config } from "drizzle-kit";
import { config } from "./src/env/env";
export default {
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    driver: "mysql2",
    dbCredentials: {
        database: config.database.name,
        host: "127.0.0.1",
        port: 3306,
        user: config.database.user,
        password: config.database.password,
    },
} satisfies Config;
