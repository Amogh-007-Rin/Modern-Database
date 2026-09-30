import { config } from "../../lib/config";
import { oauthProviders, type OAuthProvider } from "../../types/types";

interface OAuthProfile {
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface OAuthProviderConfiguration {
  authorizationUrl: string;
  clientId?: string;
  clientSecret?: string;
  scopes: string[];
  tokenUrl: string;
}

interface ConfiguredOAuthProviderConfiguration extends OAuthProviderConfiguration {
  clientId: string;
  clientSecret: string;
}

const providerConfiguration: Record<OAuthProvider, OAuthProviderConfiguration> = {
  google: {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: ["openid", "email", "profile"],
    tokenUrl: "https://oauth2.googleapis.com/token",
  },
  github: {
    authorizationUrl: "https://github.com/login/oauth/authorize",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    scopes: ["read:user", "user:email"],
    tokenUrl: "https://github.com/login/oauth/access_token",
  },
  discord: {
    authorizationUrl: "https://discord.com/oauth2/authorize",
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    scopes: ["identify", "email"],
    tokenUrl: "https://discord.com/api/oauth2/token",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function getString(value: Record<string, unknown>, key: string): string | null {
  const field = value[key];
  return typeof field === "string" && field.length > 0 ? field : null;
}

function getRedirectUri(provider: OAuthProvider): string {
  return `${config.appUrl}/auth/${provider}/callback`;
}

function getConfiguredProvider(provider: OAuthProvider): ConfiguredOAuthProviderConfiguration {
  const providerConfig = providerConfiguration[provider];

  if (!providerConfig.clientId || !providerConfig.clientSecret) {
    throw new Error(`${provider} OAuth credentials are not configured.`);
  }

  return {
    ...providerConfig,
    clientId: providerConfig.clientId,
    clientSecret: providerConfig.clientSecret,
  };
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return oauthProviders.includes(value as OAuthProvider);
}

export function createAuthorizationUrl(provider: OAuthProvider, state: string): string {
  const providerConfig = getConfiguredProvider(provider);
  const url = new URL(providerConfig.authorizationUrl);

  url.searchParams.set("client_id", providerConfig.clientId);
  url.searchParams.set("redirect_uri", getRedirectUri(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", providerConfig.scopes.join(" "));
  url.searchParams.set("state", state);

  if (provider === "google") {
    url.searchParams.set("prompt", "select_account");
  }

  return url.toString();
}

async function exchangeCode(provider: OAuthProvider, code: string): Promise<string> {
  const providerConfig = getConfiguredProvider(provider);
  const tokenResponse = await fetch(providerConfig.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(provider),
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Unable to exchange the ${provider} authorization code.`);
  }

  const token = await tokenResponse.json();

  if (!isRecord(token)) {
    throw new Error(`Invalid token response from ${provider}.`);
  }

  const accessToken = getString(token, "access_token");

  if (!accessToken) {
    throw new Error(`No access token returned by ${provider}.`);
  }

  return accessToken;
}

async function fetchJson(url: string, accessToken: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "modern-databases-auth",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve the OAuth profile.");
  }

  const body = await response.json();

  return body;
}

async function getGithubEmail(accessToken: string): Promise<string | null> {
  const emails = await fetchJson("https://api.github.com/user/emails", accessToken);
  if (!Array.isArray(emails)) {
    return null;
  }

  for (const value of emails) {
    if (!isRecord(value)) continue;

    const email = getString(value, "email");
    if (email && value.verified === true && value.primary === true) return email;
  }

  for (const value of emails) {
    if (!isRecord(value)) continue;

    const email = getString(value, "email");
    if (email && value.verified === true) return email;
  }

  return null;
}

export async function getOAuthProfile(
  provider: OAuthProvider,
  code: string,
): Promise<OAuthProfile> {
  const accessToken = await exchangeCode(provider, code);

  if (provider === "google") {
    const response = await fetchJson(
      "https://openidconnect.googleapis.com/v1/userinfo",
      accessToken,
    );
    if (!isRecord(response)) throw new Error("Invalid Google profile response.");
    const profile = response;
    const providerAccountId = getString(profile, "sub");
    const email = getString(profile, "email");

    if (!providerAccountId || !email || profile.email_verified !== true) {
      throw new Error("Google did not return a verified email address.");
    }

    return {
      providerAccountId,
      email,
      name: getString(profile, "name") ?? email.split("@")[0],
      avatarUrl: getString(profile, "picture") ?? undefined,
    };
  }

  if (provider === "github") {
    const response = await fetchJson("https://api.github.com/user", accessToken);
    if (!isRecord(response)) throw new Error("Invalid GitHub profile response.");
    const profile = response;
    const providerAccountId = getString(profile, "id");
    const email = await getGithubEmail(accessToken);

    if (!providerAccountId || !email) {
      throw new Error("GitHub did not return a verified email address.");
    }

    return {
      providerAccountId,
      email,
      name:
        getString(profile, "name") ??
        getString(profile, "login") ??
        email.split("@")[0],
      avatarUrl: getString(profile, "avatar_url") ?? undefined,
    };
  }

  const response = await fetchJson(
    "https://discord.com/api/users/@me",
    accessToken,
  );
  if (!isRecord(response)) throw new Error("Invalid Discord profile response.");
  const profile = response;
  const providerAccountId = getString(profile, "id");
  const email = getString(profile, "email");

  if (!providerAccountId || !email || profile.verified !== true) {
    throw new Error("Discord did not return a verified email address.");
  }

  return {
    providerAccountId,
    email,
    name:
      getString(profile, "global_name") ??
      getString(profile, "username") ??
      email.split("@")[0],
    avatarUrl: getString(profile, "avatar")
      ? `https://cdn.discordapp.com/avatars/${providerAccountId}/${getString(profile, "avatar")}.png`
      : undefined,
  };
}
