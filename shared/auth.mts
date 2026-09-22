import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret(): string {
  const secret = Netlify.env.get("SESSION_SECRET");
  if (!secret) {
    throw new Error("SESSION_SECRET no configurado");
  }
  return secret;
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 12; // 12 horas
  const sig = createHmac("sha256", getSecret()).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyToken(token: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac("sha256", getSecret()).update(expStr).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return verifyToken(token);
}
