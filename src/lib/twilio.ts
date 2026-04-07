import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

export async function enviarCodigoSMS(telefono: string) {
  return client.verify.v2
    .services(VERIFY_SERVICE_SID)
    .verifications.create({ to: telefono, channel: "sms" });
}

export async function verificarCodigoSMS(telefono: string, codigo: string) {
  const check = await client.verify.v2
    .services(VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: telefono, code: codigo });
  return check.status === "approved";
}
