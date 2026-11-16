import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "aow3_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function signature(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is missing.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createAdminToken() {
  const expires = String(Date.now() + MAX_AGE * 1000);
  return `${expires}.${signature(expires)}`;
}

export function isValidAdminToken(token?: string) {
  if (!token) return false;
  const [expires, supplied] = token.split(".");
  if (!expires || !supplied || Number(expires) < Date.now()) return false;
  const expected = signature(expires);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin() {
  const store = await cookies();
  return isValidAdminToken(store.get(COOKIE_NAME)?.value);
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_MAX_AGE = MAX_AGE;
