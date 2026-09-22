import { verifyAccessToken } from '../tokens/token.service.js';

/**
 * Authentication middleware verifying Bearer access tokens and Redis blacklist
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header. Expected Bearer token.',
      },
    });
  }

  const token = authHeader.split(' ')[1];
  const { valid, payload, error, code } = await verifyAccessToken(token);

  if (!valid) {
    const status = code === 'TOKEN_EXPIRED' ? 401 : 401;
    return res.status(status).json({
      success: false,
      error: {
        code: code || 'UNAUTHORIZED',
        message: error || 'Invalid token',
      },
    });
  }

  req.user = payload;
  req.token = token;
  next();
}
