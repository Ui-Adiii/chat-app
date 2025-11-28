import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // smtp-relay.brevo.com
  port: process.env.EMAIL_PORT, // 587
  secure: false, // MUST BE FALSE for port 587
  auth: {
    user: process.env.EMAIL_USER, // your Brevo SMTP username
    pass: process.env.EMAIL_PASS, // your Brevo SMTP password
  },
});

const sendOtpToEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 Chat App Verification</h2>
      <p>Your one-time password (OTP) is:</p>
      <h1 style="padding: 10px 20px; background:#e0f7fa; display:inline-block;">
        ${otp}
      </h1>
      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Chat App" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Chat App OTP Verification",
      html,
    });

    console.log("Brevo email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Brevo failed:", error.message);
    throw new Error("Email sending failed");
  }
};

export default sendOtpToEmail;
