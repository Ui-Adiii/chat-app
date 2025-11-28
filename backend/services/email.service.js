import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import dotenv from 'dotenv';
dotenv.config()

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

const sendOtpToEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 Chat App Web Verification</h2>
      <p>Your one-time password (OTP) to verify your ChatApp account is:</p>
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">${otp}</h1>
      <p><strong>This OTP is valid for the next 5 minutes.</strong> Do not share this code.</p>
      <p style="margin-top: 20px;">Thanks & Regards,<br/>ChatApp Web Security Team</p>
    </div>
  `

  // Prefer Resend when configured
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_USER || "ChatApp <onboarding@resend.dev>",
        to: email,
        subject: "Chat App Verification",
        html,
      });

      // Check if the result has data property (new Resend API structure)
      if (result && result.data) {
        console.log("OTP email sent via Resend:", result.data.id || "Success");
        return result;
      }
      // Fallback for older structure or unexpected format
      else if (result) {
        console.log(
          "OTP email sent via Resend:",
          typeof result === "object" ? JSON.stringify(result) : result
        );
        return result;
      }
    } catch (err) {
      console.warn(
        "Resend failed, falling back to nodemailer:",
        err?.message || err
      );
    }
  }

  // Fallback to nodemailer if available
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"ChatApp" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Chat App Verification',
        html,
      })
      console.log('OTP email sent via nodemailer:', info.messageId)
      return info
    } catch (error) {
      console.error('Nodemailer failed to send OTP email:', error?.message)
    }
  }

  throw new Error('No email provider configured')
}

export default sendOtpToEmail