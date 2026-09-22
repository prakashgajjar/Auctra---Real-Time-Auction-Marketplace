import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token, hash) {
  return bcrypt.compare(token, hash);
}

export function hashSha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
