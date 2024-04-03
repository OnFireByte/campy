import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "../env/env";
import * as schema from "./schema";

const connection = mysql.createPool({
    uri: `mysql://${config.database.host}`,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
});
export const db = drizzle(connection, {
    schema: schema,
    mode: "default",
});
