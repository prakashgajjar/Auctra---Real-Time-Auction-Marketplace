export function welcomeEmailTemplate(firstName) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f0f14;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background-color:#1a1a24;border-radius:16px;overflow:hidden;border:1px solid #2a2a3a;">
          <tr>
            <td style="background:linear-gradient(135deg,#6c5ce7,#a855f7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">⚡ Auctra</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Where Value Finds Its Buyer</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#fff;font-size:22px;">Welcome aboard, ${firstName}! 🎉</h2>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">Your account is now active. Start exploring auctions on Auctra.</p>
              <div style="background-color:#0f0f14;border-radius:12px;padding:24px;">
                <p style="margin:0 0 12px;color:#a855f7;font-size:16px;font-weight:600;">What you can do:</p>
                <p style="margin:4px 0;color:#d1d5db;font-size:14px;">🔍 Browse live auctions</p>
                <p style="margin:4px 0;color:#d1d5db;font-size:14px;">💰 Place bids on items</p>
                <p style="margin:4px 0;color:#d1d5db;font-size:14px;">📦 Sell your unique products</p>
                <p style="margin:4px 0;color:#d1d5db;font-size:14px;">⚡ Real-time bid updates</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
