import { baseEmailTemplate } from './base.template.js';

export function auctionStartedEmailTemplate({ username, auctionTitle, startingPrice, auctionId, endTime }) {
  const formattedPrice = Number(startingPrice || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 20px; color: #60a5fa; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        Auction Live
      </span>
      <h1 style="color: #f8fafc; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0;">
        Bidding Is Now Open!
      </h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0;">
        Hello <strong style="color: #e2e8f0;">${username || 'Bidder'}</strong>, an auction lot is now accepting bids:
      </p>
    </div>

    <!-- Auction Details -->
    <div style="background-color: #171923; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 600; color: #f8fafc; margin-bottom: 12px;">
        ${auctionTitle || 'Auctra Auction Lot'}
      </div>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Starting Bid:</td>
          <td align="right" style="color: #d4af37; font-size: 18px; font-weight: 700;">${formattedPrice}</td>
        </tr>
        ${
          endTime
            ? `<tr>
                <td style="color: #94a3b8; font-size: 14px;">Closes On:</td>
                <td align="right" style="color: #cbd5e1; font-size: 14px;">${new Date(endTime).toUTCString()}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin: 0;">
      Jump in early and secure your leading bid!
    </p>
  `;

  return baseEmailTemplate({
    title: `Auction Started: ${auctionTitle || 'Auctra Lot'}`,
    preheader: `Bidding has started for ${auctionTitle} starting at ${formattedPrice}`,
    contentHtml,
    actionButton: {
      text: 'View Auction & Place Bid',
      url: `https://auctra.marketplace/auctions/${auctionId || ''}`,
    },
  });
}
