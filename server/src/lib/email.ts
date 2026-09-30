import nodemailer from "nodemailer";
import { config } from "./config";

interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

function getSmtpOptions(): SmtpOptions | null {
  const host = process.env.SMTP_HOST;

  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure =
    (process.env.SMTP_SECURE ?? (port === 465 ? "true" : "false")) === "true";

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM ?? '"Modern Databases" <no-reply@localhost>',
  };
}

export function isEmailConfigured(): boolean {
  return getSmtpOptions() !== null;
}

export function getPasswordResetUrl(token: string): string {
  return `${config.webUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface PasswordResetEmail {
  subject: string;
  text: string;
  html: string;
}

export function buildPasswordResetEmail(
  name: string,
  resetUrl: string,
): PasswordResetEmail {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);
  const subject = "Reset your Modern Databases password";

  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset the password for your Modern Databases account.",
    "",
    `Reset your password here (valid for 1 hour): ${resetUrl}`,
    "",
    "If you didn't request this, you can safely ignore this email — your password won't change.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      Reset your Modern Databases password. This link expires in 1 hour.
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width: 560px; width: 100%; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
            <tr>
              <td align="center" style="background-color: #18181b; padding: 28px 32px;">
                <div style="color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">
                  Modern&nbsp;Databases
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 36px 36px 8px 36px;">
                <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 24px; line-height: 1.25; font-weight: 700;">
                  Reset your password
                </h1>
                <p style="margin: 0 0 16px 0; color: #3f3f46; font-size: 15px; line-height: 1.6;">
                  Hi ${safeName},
                </p>
                <p style="margin: 0 0 24px 0; color: #3f3f46; font-size: 15px; line-height: 1.6;">
                  We received a request to reset the password for your account.
                  Click the button below to choose a new one. This link
                  <strong>expires in 1 hour</strong>.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="padding: 8px 0 24px 0;">
                      <a href="${safeUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-decoration: none; padding: 14px 40px; border-radius: 8px;">
                        Reset password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; line-height: 1.6;">
                  Button not working? Copy and paste this link into your browser:
                </p>
                <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; word-break: break-all;">
                  <a href="${safeUrl}" style="color: #18181b; text-decoration: underline;">${safeUrl}</a>
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="border-top: 1px solid #e4e4e7; padding-top: 20px;">
                      <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.6;">
                        If you didn&apos;t request a password reset, you can safely
                        ignore this email — your password won&apos;t change.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px 32px 28px 32px;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6;">
                  Sent by Modern Databases &middot; Please don&apos;t reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const resetUrl = getPasswordResetUrl(token);
  const smtp = getSmtpOptions();

  if (!smtp) {
    if (config.isProduction) {
      console.error(
        "Password reset was requested but SMTP is not configured; no email was sent.",
      );
    } else {
      console.log(`[dev] SMTP not configured. Password reset link: ${resetUrl}`);
    }
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth:
        smtp.user !== undefined
          ? { user: smtp.user, pass: smtp.pass ?? "" }
          : undefined,
    });
    const email = buildPasswordResetEmail(name, resetUrl);

    await transporter.sendMail({
      from: smtp.from,
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    console.log("Password reset email sent.");
  } catch (error) {
    // Never fail the request over email delivery; the endpoint intentionally
    // returns a generic response to avoid leaking account existence.
    console.error("Unable to send password reset email:", error);
  }
}
