import { baseEmailTemplate } from './base.template.js';

export function outbidEmailTemplate({ username, auctionTitle, newBidAmount, auctionId, endTime }) {
  const formattedBid = Number(newBidAmount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; color: #f87171; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        Outbid Alert
      </span>
      <h1 style="color: #f8fafc; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0;">
        You've Been Outbid!
      </h1>
      <p style="color: #94a3b8; font-size: 15px; margin: 0;">
        Hello <strong style="color: #e2e8f0;">${username || 'Bidder'}</strong>, another bidder just placed a higher bid on:
      </p>
    </div>

    <!-- Auction Box -->
    <div style="background-color: #171923; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 600; color: #f8fafc; margin-bottom: 12px;">
        ${auctionTitle || 'Auctra Auction Lot'}
      </div>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
        <tr>
          <td style="color: #94a3b8; font-size: 14px;">Current Highest Bid:</td>
          <td align="right" style="color: #d4af37; font-size: 20px; font-weight: 700;">${formattedBid}</td>
        </tr>
        ${
          endTime
            ? `<tr>
                <td style="color: #94a3b8; font-size: 14px;">Auction Ends:</td>
                <td align="right" style="color: #cbd5e1; font-size: 14px;">${new Date(endTime).toUTCString()}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin: 0;">
      Don't lose out on this item! Place a new bid now before the clock runs out.
    </p>
  `;

  return baseEmailTemplate({
    title: `You have been outbid on ${auctionTitle || 'Auctra Auction'}`,
    preheader: `Someone outbid you at ${formattedBid}. Bid again now!`,
    contentHtml,
    actionButton: {
      text: 'Place Counter-Bid Now',
      url: `https://auctra.marketplace/auctions/${auctionId || ''}`,
    },
  });
}
