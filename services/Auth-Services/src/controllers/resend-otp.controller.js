import { resendVerificationOtp } from '../services/resend-otp.service.js';

export async function resendOtpController(req, res, next) {
  try {
    const result = await resendVerificationOtp(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
