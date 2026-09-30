export interface Logger {
  totalRequestCount: number;
}

export const oauthProviders = ["google", "github", "discord"] as const;

export type OAuthProvider = (typeof oauthProviders)[number];

export interface OAuthAccount {
  provider: OAuthProvider;
  providerAccountId: string;
}

export interface User {
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  providers: OAuthAccount[];
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
}
