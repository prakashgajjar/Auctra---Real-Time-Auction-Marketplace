/**
 * Strips sensitive fields like passwordHash from the user object
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}
