import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import config from '../config/index.js';
import { otpEmailTemplate } from './templates/otp.template.js';
import { welcomeEmailTemplate } from './templates/welcome.template.js';

// Nodemailer Gmail SMTP transporter
let transporter = null;
if (config.smtp.user && config.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

// Resend client (if configured)
const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

/**
 * Send OTP Verification or Password Reset Email
 */
export async function sendOtpEmail(to, otp) {
  const subject = `${otp} — Your Auctra Verification Code`;
  const html = otpEmailTemplate(otp, config.otp.expiryMinutes);

  // 1. Primary: Direct Gmail SMTP (puplix.business@gmail.com)
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Auctra" <${config.smtp.user}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ [Gmail SMTP] OTP email sent successfully to ${to}`);
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error(`❌ Gmail SMTP failed for ${to}:`, err.message);
    }
  }

  // 2. Secondary: Resend API (if available)
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Resend API error:', error);
      } else {
        console.log(`✅ [Resend] OTP email sent to ${to} (ID: ${data.id})`);
        return { success: true, provider: 'resend', id: data.id };
      }
    } catch (err) {
      console.error('❌ Resend exception:', err.message);
    }
  }

  return { success: false, error: 'No email transport succeeded' };
}

/**
 * Send Welcome Email to verified user
 */
export async function sendWelcomeEmail(to, firstName) {
  const subject = 'Welcome to Auctra! 🎉';
  const html = welcomeEmailTemplate(firstName);

  // 1. Primary: Direct Gmail SMTP (puplix.business@gmail.com)
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Auctra" <${config.smtp.user}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ [Gmail SMTP] Welcome email sent successfully to ${to}`);
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error(`❌ Gmail SMTP welcome failed for ${to}:`, err.message);
    }
  }

  // 2. Secondary: Resend API (if available)
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Resend API error:', error);
      } else {
        console.log(`✅ [Resend] Welcome email sent to ${to} (ID: ${data.id})`);
        return { success: true, provider: 'resend', id: data.id };
      }
    } catch (err) {
      console.error('❌ Resend exception:', err.message);
    }
  }

  return { success: false, error: 'No email transport succeeded' };
}
