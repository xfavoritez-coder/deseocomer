import twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return twilio(sid, token);
}

export async function enviarCodigoSMS(telefono: string) {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) throw new Error("TWILIO_VERIFY_SERVICE_SID not configured");
  return getClient().verify.v2
    .services(serviceSid)
    .verifications.create({ to: telefono, channel: "sms" });
}

export async function verificarCodigoSMS(telefono: string, codigo: string) {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) throw new Error("TWILIO_VERIFY_SERVICE_SID not configured");
  const check = await getClient().verify.v2
    .services(serviceSid)
    .verificationChecks.create({ to: telefono, code: codigo });
  return check.status === "approved";
}
