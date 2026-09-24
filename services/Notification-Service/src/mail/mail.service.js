import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import config from '../config/index.js';
import { outbidEmailTemplate } from './templates/outbid.template.js';
import { auctionWonEmailTemplate } from './templates/auction-won.template.js';
import { auctionStartedEmailTemplate } from './templates/auction-started.template.js';
import { endingSoonEmailTemplate } from './templates/ending-soon.template.js';
import { paymentEmailTemplate } from './templates/payment.template.js';
import { orderShippedEmailTemplate } from './templates/order-shipped.template.js';
import { systemEmailTemplate } from './templates/system.template.js';

// Setup Nodemailer Transporter
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

// Setup Resend Client
const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

/**
 * Low-level email sender with automatic failover:
 * 1. Resend API
 * 2. Nodemailer Gmail SMTP
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!config.features.enableEmail) {
    console.log(`[Email Disabled] Skipped sending "${subject}" to ${to}`);
    return { success: true, provider: 'disabled' };
  }

  // 1. Resend API
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.from,
        to: [to],
        subject,
        html,
        ...(text && { text }),
      });

      if (error) {
        console.warn(`[Resend Notice] ${error.message} - falling back to SMTP if available`);
      } else {
        console.log(`✓ [Resend] Dispatched "${subject}" to ${to} (ID: ${data.id})`);
        return { success: true, provider: 'resend', id: data.id };
      }
    } catch (err) {
      console.warn(`[Resend Failed] ${err.message} - trying SMTP fallback`);
    }
  }

  // 2. Nodemailer SMTP Fallback
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Auctra Marketplace" <${config.smtp.user}>`,
        to,
        subject,
        html,
        ...(text && { text }),
      });
      console.log(`✓ [SMTP] Dispatched "${subject}" to ${to} (MessageId: ${info.messageId})`);
      return { success: true, provider: 'smtp', id: info.messageId };
    } catch (err) {
      console.error(`✗ [SMTP Failed] Error delivering to ${to}:`, err.message);
    }
  }

  console.warn(`⚠ [Email Fallback] Neither Resend nor SMTP completed delivery for ${to}`);
  return { success: false, error: 'No email transport succeeded' };
}

// Convenience templated dispatchers
export async function sendOutbidEmail(data) {
  const html = outbidEmailTemplate(data);
  return sendEmail({
    to: data.to,
    subject: `Outbid Alert: ${data.auctionTitle || 'Auctra Auction'}`,
    html,
  });
}

export async function sendAuctionWonEmail(data) {
  const html = auctionWonEmailTemplate(data);
  return sendEmail({
    to: data.to,
    subject: `Congratulations! You won ${data.auctionTitle || 'Auctra Auction'}`,
    html,
  });
}

export async function sendAuctionStartedEmail(data) {
  const html = auctionStartedEmailTemplate(data);
  return sendEmail({
    to: data.to,
    subject: `Auction Started: ${data.auctionTitle || 'Auctra Lot'}`,
    html,
  });
}

export async function sendEndingSoonEmail(data) {
  const html = endingSoonEmailTemplate(data);
  return sendEmail({
    to: data.to,
    subject: `⏳ Ending Soon: ${data.auctionTitle || 'Auction Lot'}`,
    html,
  });
}

export async function sendPaymentEmail(data) {
  const html = paymentEmailTemplate(data);
  return sendEmail({
    to: data.to,
    subject: `Payment ${data.paymentStatus || 'Confirmed'} — Order #${data.orderId || ''}`,
    html,
  });
}

export async function sendOrderShippedEmail(data) {
  const html = orderShippedEmailTemplate(data);
  return sendEmail({
    to: data.to,
    subject: `📦 Order Shipped: ${data.auctionTitle || 'Auctra Package'}`,
    html,
  });
}

export async function sendSystemEmail(data) {
  const html = systemEmailTemplate(data);
  return sendEmail({
    to: data.to,
    subject: data.title || 'Auctra System Notice',
    html,
  });
}
