import { baseEmailTemplate } from './base.template.js';

export function paymentEmailTemplate({ username, orderId, auctionTitle, amount, paymentStatus = 'SUCCESSFUL', transactionId }) {
  const isSuccess = paymentStatus === 'SUCCESSFUL';
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const badgeColor = isSuccess ? '#4ade80' : '#f87171';
  const badgeBg = isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  const badgeBorder = isSuccess ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 20px; color: ${badgeColor}; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        Payment ${paymentStatus}
      </span>
      <h1 style="color: #f8fafc; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0;">
        ${isSuccess ? 'Payment Confirmed! ✅' : 'Payment Notification'}
      </h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0;">
        Hello <strong style="color: #e2e8f0;">${username || 'Customer'}</strong>, your payment details are below:
      </p>
    </div>

    <!-- Receipt Details -->
    <div style="background-color: #171923; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
        ${
          orderId
            ? `<tr>
                <td style="color: #94a3b8; font-size: 14px;">Order ID:</td>
                <td align="right" style="color: #cbd5e1; font-size: 14px; font-family: monospace;">#${orderId}</td>
              </tr>`
            : ''
        }
        ${
          auctionTitle
            ? `<tr>
                <td style="color: #94a3b8; font-size: 14px;">Item:</td>
                <td align="right" style="color: #f8fafc; font-size: 14px; font-weight: 600;">${auctionTitle}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Amount Paid:</td>
          <td align="right" style="color: #d4af37; font-size: 20px; font-weight: 700;">${formattedAmount}</td>
        </tr>
        ${
          transactionId
            ? `<tr>
                <td style="color: #94a3b8; font-size: 14px;">Transaction Ref:</td>
                <td align="right" style="color: #64748b; font-size: 13px; font-family: monospace;">${transactionId}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin: 0;">
      ${
        isSuccess
          ? 'The seller has been notified to prepare and dispatch your shipment.'
          : 'Please retry payment if the transaction was not completed.'
      }
    </p>
  `;

  return baseEmailTemplate({
    title: `Payment ${paymentStatus}: Order #${orderId || ''}`,
    preheader: `Payment of ${formattedAmount} ${paymentStatus.toLowerCase()} for your Auctra order.`,
    contentHtml,
    actionButton: {
      text: 'View Order Details',
      url: `https://auctra.marketplace/orders/${orderId || ''}`,
    },
  });
}
