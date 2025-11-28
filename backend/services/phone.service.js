import twilio from 'twilio';

const account_sid = process.env.TWILIO_ACCOUNT_SID;
const auth_token = process.env.TWILIO_AUTH_TOKEN;
const service_sid = process.env.TWILIO_SERVICE_SID;

// Check if Twilio credentials are provided
if (!account_sid || !auth_token || !service_sid) {
  console.warn(
    "Twilio credentials not provided. SMS functionality will be disabled."
  );
}

let client;
if (account_sid && auth_token && service_sid) {
  client = twilio(account_sid, auth_token);
}

const sendOtpToPhoneNumber = async (phoneNumber) => {
  // If Twilio is not configured, skip SMS sending
  if (!client) {
    throw new Error("SMS service not configured");
  }

  try {
    console.log("Sending OTP to " + phoneNumber);
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const response = await client.verify.v2
      .services(service_sid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    console.log("SMS sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw new Error("Failed to send OTP via SMS: " + error.message);
  }
};

const verifyOtpService = async (phoneNumber, otp) => {
  // If Twilio is not configured, skip verification
  if (!client) {
    throw new Error("SMS service not configured");
  }

  try {
    console.log("Verifying OTP for", phoneNumber);
    const response = await client.verify.v2
      .services(service_sid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    console.log("OTP verification result:", response);
    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    throw new Error("Failed to verify OTP: " + error.message);
  }
};

export { sendOtpToPhoneNumber, verifyOtpService };