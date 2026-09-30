import { createHash, randomBytes } from "node:crypto";
import type { OAuthAccount, User } from "../../types/types";

export interface SessionPayload {
  [key: string]: string;
  sub: string;
  email: string;
}

export interface JwtService {
  sign(payload: SessionPayload): Promise<string>;
  verify(token: string): Promise<unknown | false>;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  providers: OAuthAccount["provider"][];
}

type UserDocument = Pick<User, "name" | "email" | "avatarUrl" | "providers"> & {
  id: string;
};

export function getSessionToken(
  authorization: string | undefined,
  sessionCookie: unknown,
): string | null {
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return typeof sessionCookie === "string" ? sessionCookie : null;
}

export function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return typeof payload.sub === "string" && typeof payload.email === "string";
}

export async function createSession(
  jwt: JwtService,
  user: Pick<UserDocument, "id" | "email">,
): Promise<string> {
  return jwt.sign({ sub: user.id, email: user.email });
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    providers: user.providers.map(({ provider }) => provider),
  };
}

export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export function createPasswordResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(token);

  return { token, tokenHash };
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
