export function otpEmailTemplate(otp, expiryMinutes) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f0f14;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background-color:#1a1a24;border-radius:16px;overflow:hidden;border:1px solid #2a2a3a;">
          <tr>
            <td style="background:linear-gradient(135deg,#6c5ce7,#a855f7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">⚡ Auctra</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Where Value Finds Its Buyer</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;">Verify your email address</h2>
              <p style="margin:0 0 32px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Use the code below to complete your registration. Expires in <strong style="color:#a855f7;">${expiryMinutes} minutes</strong>.
              </p>
              <div style="background-color:#0f0f14;border:2px solid #6c5ce7;border-radius:12px;padding:24px;text-align:center;margin:0 0 32px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">${otp}</span>
              </div>
              <p style="margin:0;color:#6b7280;font-size:13px;">If you didn't create an account on Auctra, you can safely ignore this email.</p>
              <hr style="border:none;border-top:1px solid #2a2a3a;margin:24px 0;" />
              <p style="margin:0;color:#4b5563;font-size:12px;text-align:center;">Automated email from Auctra. Do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
