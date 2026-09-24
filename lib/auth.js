import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-prod";

export function createToken(payload) {
  const data = JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  const encoded = Buffer.from(data).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest();
  return `${encoded}.${sig.toString("base64url")}`;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx < 0) return null;
    const encoded = token.slice(0, dotIdx);
    const sigB64 = token.slice(dotIdx + 1);
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(encoded)
      .digest();
    const provided = Buffer.from(sigB64, "base64url");
    if (provided.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(provided, expected)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuth(request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}
