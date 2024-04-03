import { Resend } from "resend";
import { config } from "../../env/env";

export const resend = new Resend(config.resend.api_key);

export async function sendEmailVerification(email: string, token: string, url: string) {
    const path = `/auth/email-confirmation/${token}`;
    url = new URL(path, url).toString();

    console.log("Sending email to", email, "with url", url);
    const res = await resend.emails.send({
        from: "noreply@heathub.pkpt.dev",
        to: email,
        subject: "Verify your email",
        html: `<h1>Verify your email</h1> <p>Click <a href="${url}">here</a> to verify your email.</p> <p>Or copy and paste this link into your browser: ${url}</p>`,
    });

    console.log("Email sent", res);
}
