import { baseEmailTemplate } from './base.template.js';

export function systemEmailTemplate({ username, title, message, actionUrl = null, actionText = 'Open Auctra' }) {
  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 20px; color: #818cf8; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        System Notice
      </span>
      <h1 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 16px 0 8px 0;">
        ${title || 'Notification from Auctra'}
      </h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0;">
        Hello <strong style="color: #e2e8f0;">${username || 'Member'}</strong>,
      </p>
    </div>

    <!-- Message Body -->
    <div style="background-color: #171923; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 22px; margin-bottom: 24px; color: #cbd5e1; font-size: 15px; line-height: 1.7;">
      ${message}
    </div>
  `;

  return baseEmailTemplate({
    title: title || 'Auctra Update',
    preheader: title || 'Auctra Announcement',
    contentHtml,
    actionButton: actionUrl
      ? {
          text: actionText,
          url: actionUrl,
        }
      : null,
  });
}
