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
export async function CreateUser(data: CreateUserInput) {
    const result = await db.transaction(async (tx) => {
        await tx.insert(users).values(data);
        const result = await tx.query.users.findFirst({
            where: eq(users.email, data.email),
        });
        if (result === undefined) {
            throw new Error("User not found");
        }

        const token = Math.random().toString(36).substring(2);
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
        message: "Email verified",
    };
}
