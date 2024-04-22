import { eq } from "drizzle-orm";
import { error } from "elysia";
import { db } from "../../db/db";
import { emailVerifications, users } from "../../db/schema";
import { config } from "../../env/env";
import { sendEmailVerification } from "../email/email";

type CreateUserInput = {
    email: string;
    password: string;
    name: string;
    telephoneNumber: string;
};

function createToken(length: number) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
}

export async function createUser(data: CreateUserInput) {
    const result = await db.transaction(async (tx) => {
        await tx.insert(users).values(data);
        const result = await tx.query.users.findFirst({
            where: eq(users.email, data.email),
        });
        if (result === undefined) {
            throw new Error("User not found");
        }

        const token = createToken(32);

        await tx.insert(emailVerifications).values({
            userID: result?.id,
            token: token,
        });

        try {
            await sendEmailVerification(data.email, token, config.resend.domain);
        } catch (err) {
            console.error(err);
            tx.rollback();
        }
        return result;
    });
    return result;
}

export async function VerifyEmail(token: string) {
    const result = await db.query.emailVerifications.findFirst({
        where: eq(emailVerifications.token, token),
    });
    if (result === undefined) {
        return error(404, {
            message: "Invalid token",
        });
    }

    await db.transaction(async (tx) => {
        await tx
            .update(users)
            .set({
                verified: true,
            })
            .where(eq(users.id, result.userID));
        await tx.delete(emailVerifications).where(eq(emailVerifications.token, token));
    });

    return {
        message: "Email verified, you can now sign in.",
    } as const;
}
