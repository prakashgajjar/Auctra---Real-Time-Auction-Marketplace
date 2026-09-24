import { baseEmailTemplate } from './base.template.js';

export function auctionWonEmailTemplate({ username, auctionTitle, winningBidAmount, auctionId }) {
  const formattedBid = Number(winningBidAmount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 20px; color: #4ade80; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        Auction Won 🎉
      </span>
      <h1 style="color: #f8fafc; font-size: 26px; font-weight: 800; margin: 16px 0 8px 0;">
        Congratulations, You Won!
      </h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0;">
        Dear <strong style="color: #e2e8f0;">${username || 'Winner'}</strong>, you placed the winning bid on:
      </p>
    </div>

    <!-- Details Box -->
    <div style="background-color: #171923; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 22px; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px;">
        ${auctionTitle || 'Auctra Auction Lot'}
      </div>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Winning Bid:</td>
          <td align="right" style="color: #d4af37; font-size: 22px; font-weight: 800;">${formattedBid}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Settlement Status:</td>
          <td align="right" style="color: #38bdf8; font-weight: 600; font-size: 14px;">Awaiting Payment</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin: 0 0 10px 0;">
      Please proceed to checkout and complete payment within 24 hours to secure delivery.
    </p>
  `;

  return baseEmailTemplate({
    title: `Congratulations! You won ${auctionTitle || 'Auction'}`,
    preheader: `You won the auction at ${formattedBid}. Complete payment now.`,
    contentHtml,
    actionButton: {
      text: 'Complete Payment Now',
      url: `https://auctra.marketplace/checkout?auctionId=${auctionId || ''}`,
    },
  });
}
