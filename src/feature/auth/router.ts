import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { authPlugin } from "./plugin";
import { CreateUser, VerifyEmail } from "./service";

export const authRouter = new Elysia({
    prefix: "/auth",
})
    .use(authPlugin)
    .post(
        "/signup",
        async ({ body, error }) => {
            const data = {
                name: body.name,
                email: body.email.toLowerCase(),
                password: bcrypt.hashSync(body.password, 12),
                telephoneNumber: body.telephoneNumber.replace(/[^0-9]/g, ""),
            };

            try {
                await CreateUser(data);
                return {
                    message: "Success",
                };
            } catch (err) {
                console.log(err);
                return error(500, {
                    message: "Failed to sign up",
                });
            }
        },
        {
            body: t.Object({
                email: t.String({ format: "email", minLength: 1 }),
                password: t.String({ minLength: 8 }),
                name: t.String({ minLength: 1 }),
                telephoneNumber: t.String({ minLength: 1 }),
            }),
            tags: ["Auth"],
            response: {
                200: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .get(
        "/email-confirmation/:token",
        async ({ params, error }) => {
            try {
                const res = await VerifyEmail(params.token);
                return res;
            } catch (err) {
                console.log(err);
                return error(500, {
                    message: "Failed to verify email",
                });
            }
        },
        {
            params: t.Object({
                token: t.String({ minLength: 1 }),
            }),
            tags: ["Auth"],
            response: {
                200: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                404: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .post(
        "/signin",
        async ({ jwt, body, error }) => {
            try {
                const data = await db.query.users.findFirst({
                    where: eq(users.email, body.email),
                });

                if (data === undefined) {
                    return error(404, {
                        message: "User not found",
                    });
                }

                if (!bcrypt.compareSync(body.password, data.password)) {
                    return error(401, {
                        message: "Incorrect password",
                    });
                }

                return {
                    message: "Success",
                    token: await jwt.sign({
                        id: data.id,
                        role: data.role,
                        name: data.name,
                        email: data.email,
                    }),
                };
            } catch (err) {
                console.log(err);
                return error(500, {
                    message: "Failed to sign in",
                });
            }
        },
        {
            body: t.Object({
                email: t.String({ format: "email", minLength: 1 }),
                password: t.String({ minLength: 8 }),
            }),
            tags: ["Auth"],
            response: {
                200: t.Object({
                    message: t.String({ minLength: 1 }),
                    token: t.String({ minLength: 1 }),
                }),
                401: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                404: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
                500: t.Object({
                    message: t.String({ minLength: 1 }),
                }),
            },
        }
    )
    .get(
        "me",
        async ({ user }) => {
            return user!;
        },
        {
            auth: ["user", "admin"],
            tags: ["Auth"],
            response: {
                200: t.Object({
                        id: t.Number(),
                        email: t.String(),
                        name: t.String(),
                        role: t.String(),
                }),
            },
        }
    );
