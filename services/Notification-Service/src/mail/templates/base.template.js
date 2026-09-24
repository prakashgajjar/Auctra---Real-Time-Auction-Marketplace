/**
 * Auctra Premium Brand Responsive HTML Email Frame
 */
export function baseEmailTemplate({ title, preheader = '', contentHtml, actionButton = null }) {
  const currentYear = new Date().getFullYear();

  const buttonHtml = actionButton
    ? `
      <div style="margin: 32px 0 24px 0; text-align: center;">
        <a href="${actionButton.url}"
           style="background: linear-gradient(135deg, #d4af37 0%, #f3ba2f 100%);
                  color: #0c0d12;
                  font-weight: 700;
                  font-size: 15px;
                  text-decoration: none;
                  padding: 14px 32px;
                  border-radius: 8px;
                  display: inline-block;
                  letter-spacing: 0.5px;
                  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);">
          ${actionButton.text}
        </a>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #07080a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #e2e8f0;">
  <!-- Preheader text for inbox preview -->
  <span style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; mso-hide: all;">
    ${preheader}
  </span>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07080a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0f1117; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Header Bar with Golden Glow -->
          <tr>
            <td style="background: linear-gradient(180deg, rgba(212, 175, 55, 0.12) 0%, rgba(15, 17, 23, 0) 100%); padding: 32px 36px 20px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #f8fafc;">
                      AUC<span style="color: #d4af37;">TRA</span>
                    </span>
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #94a3b8; margin-top: 4px;">
                      Real-Time Auction Marketplace
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              ${contentHtml}
              ${buttonHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #090a0f; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 8px 0;">
                You received this transactional update because you have an account or active bids on <strong style="color: #cbd5e1;">Auctra</strong>.
              </p>
              <p style="margin: 0;">
                &copy; ${currentYear} Auctra Inc. All rights reserved. &bull; Enterprise Real-Time Trading Engine
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
