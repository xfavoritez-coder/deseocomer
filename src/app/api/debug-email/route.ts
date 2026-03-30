import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function GET() {
  const hasKey = !!process.env.RESEND_API_KEY;
  const keyPrefix = process.env.RESEND_API_KEY?.slice(0, 8) ?? "no key";
  const fromEmail = process.env.FROM_EMAIL ?? "no FROM_EMAIL";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "no APP_URL";

  // Try sending a test email
  let sendResult = null;
  let sendError = null;
  try {
    const result = await resend.emails.send({
      from: `DeseoComer <${fromEmail}>`,
      to: fromEmail, // send to self
      subject: "Test desde DeseoComer",
      text: "Si recibes esto, el email funciona correctamente.",
    });
    sendResult = result;
  } catch (err) {
    sendError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    hasKey,
    keyPrefix,
    fromEmail,
    appUrl,
    sendResult,
    sendError,
  });
}
