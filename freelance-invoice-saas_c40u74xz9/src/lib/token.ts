import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key-change-in-production';
const TOKEN_VALIDITY_HOURS = 24 * 7; // 7 days

export interface TokenPayload {
  invoiceId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface SignedToken {
  token: string;
  expiresAt: Date;
}

/**
 * Signs an invoice token for public viewing
 */
export function signInvoiceToken(invoiceId: string, userId: string): SignedToken {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + TOKEN_VALIDITY_HOURS * 60 * 60 * 1000;
  const payload: TokenPayload = {
    invoiceId,
    userId,
    issuedAt,
    expiresAt,
  };

  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex');
  const token = Buffer.from(data).toString('base64') + '.' + signature;

  return {
    token,
    expiresAt: new Date(expiresAt),
  };
}

/**
 * Verifies an invoice token and returns the payload if valid
 */
export function verifyInvoiceToken(token: string): TokenPayload | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const payloadData = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const payload: TokenPayload = JSON.parse(payloadData);

    // Check if token is expired
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    // Recompute the signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts the invoice ID from a token without verifying the signature
 * This is unsafe and should only be used for non-critical operations
 */
export function extractInvoiceIdFromToken(token: string): string | null {
  const [encodedPayload] = token.split('.');
  if (!encodedPayload) {
    return null;
  }

  try {
    const payloadData = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const payload: TokenPayload = JSON.parse(payloadData);
    return payload.invoiceId;
  } catch (error) {
    return null;
  }
}