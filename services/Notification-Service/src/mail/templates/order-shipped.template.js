import { baseEmailTemplate } from './base.template.js';

export function orderShippedEmailTemplate({ username, orderId, auctionTitle, trackingNumber, carrier = 'BlueDart / Delhivery' }) {
  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.4); border-radius: 20px; color: #38bdf8; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        Order Shipped 📦
      </span>
      <h1 style="color: #f8fafc; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0;">
        Your Package Is On Its Way!
      </h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0;">
        Hello <strong style="color: #e2e8f0;">${username || 'Customer'}</strong>, your item has been dispatched:
      </p>
    </div>

    <!-- Tracking Details -->
    <div style="background-color: #171923; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 600; color: #f8fafc; margin-bottom: 12px;">
        ${auctionTitle || 'Auctra Order'}
      </div>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
        ${
          orderId
            ? `<tr>
                <td style="color: #94a3b8; font-size: 14px;">Order ID:</td>
                <td align="right" style="color: #cbd5e1; font-size: 14px; font-family: monospace;">#${orderId}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Carrier:</td>
          <td align="right" style="color: #cbd5e1; font-size: 14px;">${carrier}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Tracking Number:</td>
          <td align="right" style="color: #38bdf8; font-size: 16px; font-weight: 700; font-family: monospace;">${trackingNumber || 'Available in order page'}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin: 0;">
      Please inspect the package upon arrival and confirm delivery in your Auctra dashboard.
    </p>
  `;

  return baseEmailTemplate({
    title: `Order Shipped: #${orderId || ''}`,
    preheader: `Your package for ${auctionTitle} is on its way with tracking number ${trackingNumber || ''}.`,
    contentHtml,
    actionButton: {
      text: 'Track Your Shipment',
      url: `https://auctra.marketplace/orders/${orderId || ''}/track`,
    },
  });
}
