import { baseEmailTemplate } from './base.template.js';

export function endingSoonEmailTemplate({ username, auctionTitle, currentBidAmount, auctionId, minutesRemaining = 15 }) {
  const formattedBid = Number(currentBidAmount || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 20px; color: #fbbf24; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        Ending Soon ⏳
      </span>
      <h1 style="color: #f8fafc; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0;">
        Auction Closes in ${minutesRemaining} Minutes!
      </h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0;">
        Hello <strong style="color: #e2e8f0;">${username || 'Bidder'}</strong>, the clock is ticking down rapidly on:
      </p>
    </div>

    <!-- Auction Details -->
    <div style="background-color: #171923; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 600; color: #f8fafc; margin-bottom: 12px;">
        ${auctionTitle || 'Auctra Auction Lot'}
      </div>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Current High Bid:</td>
          <td align="right" style="color: #d4af37; font-size: 20px; font-weight: 700;">${formattedBid}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Time Remaining:</td>
          <td align="right" style="color: #fbbf24; font-size: 15px; font-weight: 700;">Under ${minutesRemaining} min</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin: 0;">
      Anti-sniping protection is active. Bids in the final 30 seconds extend the auction!
    </p>
  `;

  return baseEmailTemplate({
    title: `Ending Soon: ${auctionTitle || 'Auction Lot'}`,
    preheader: `Only ${minutesRemaining} minutes remaining for ${auctionTitle}. Current bid ${formattedBid}.`,
    contentHtml,
    actionButton: {
      text: 'Bid Before Time Runs Out',
      url: `https://auctra.marketplace/auctions/${auctionId || ''}`,
    },
  });
}
