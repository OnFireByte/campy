import * as fs from "fs";
import * as yaml from "js-yaml";
import { z } from "zod";

let env = "dev";
if (process.env.env) {
    env = process.env.env;
}

const rawConfig = yaml.load(fs.readFileSync(`./config/config.${env}.yaml`, "utf8"));

const configSchema = z.object({
    database: z.object({
        host: z.string(),
        user: z.string(),
        password: z.string(),
        name: z.string(),
    }),
    resend: z.object({
        api_key: z.string(),
        domain: z.string(),
    }),
    jwt: z.object({
        secret: z.string(),
    }),
});

const data = configSchema.safeParse(rawConfig);

if (!data.success) {
    console.error("Invalid config file");
    console.error(data.error.errors);
    process.exit(1);
}

export const config = data.data;
