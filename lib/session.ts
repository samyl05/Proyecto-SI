import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROFESOR' | 'ESTUDIANTE';
  studentId: number | null;
  approved: boolean;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET no está configurado');
  }

  return 'development-only-secret-change-before-deploying';
}

function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const [payload, signature, ...extra] = token.split('.');
  if (!payload || !signature || extra.length > 0) return null;

  const expectedSignature = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionUser;

    if (
      !decoded ||
      typeof decoded.id !== 'string' ||
      typeof decoded.email !== 'string' ||
      !['ADMIN', 'PROFESOR', 'ESTUDIANTE'].includes(decoded.role)
    ) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
