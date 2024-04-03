import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { z } from "zod";

export const JWTPayloadSchema = z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    role: z.enum(["admin", "user"]),
});

const config = {
    jwt: {
        secret: "your_secret_key_here",
    },
};

export const JWTPlugin = jwt({
    name: "jwt",
    secret: config.jwt.secret,
});

export const authPlugin = new Elysia({ name: "auth-plugin" })
    .use(bearer())
    .use(JWTPlugin)
    .derive({ as: "global" }, async ({ jwt, bearer }) => {
        let user: z.infer<typeof JWTPayloadSchema> | null = null;
        let jwtValue = await jwt.verify(bearer);

        const userData = JWTPayloadSchema.safeParse(jwtValue);
        if (userData.success) {
            user = userData.data;
        }

        return {
            user: user,
        };
    })
    .macro(({ onBeforeHandle }) => ({
        auth(roles: ("user" | "admin")[]) {
            onBeforeHandle(async ({ user, error }) => {
                if (!user) {
                    return error(401, {
                        message: "Unauthorized",
                    });
                }

                if (!roles.includes(user.role)) {
                    return error(403, {
                        message: "Forbidden",
                    });
                }
            });
        },
    }));
