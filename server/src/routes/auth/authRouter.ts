import { jwt } from "@elysia/jwt";
import { Elysia, t } from "elysia";
import { UserModel } from "../../db/model";
import { config } from "../../lib/config";
import type { OAuthProvider } from "../../types/types";
import {
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
  createPasswordResetToken,
  createSession,
  getSessionToken,
  hashPasswordResetToken,
  isSessionPayload,
  toPublicUser,
} from "./authHelpers";
import {
  createAuthorizationUrl,
  getOAuthProfile,
  isOAuthProvider,
} from "./oauth";
import { sendPasswordResetEmail } from "../../lib/email";

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
const OAUTH_STATE_DURATION_SECONDS = 10 * 60;

function setSessionCookie(
  session: { set: (options: Record<string, unknown>) => void },
  value: string,
): void {
  session.set({
    value,
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: config.isProduction,
  });
}

function clearCookie(cookie: { set: (options: Record<string, unknown>) => void }): void {
  cookie.set({
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/auth",
    sameSite: "lax",
    secure: config.isProduction,
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  profile: Awaited<ReturnType<typeof getOAuthProfile>>,
) {
  const existingProviderUser = await UserModel.findOne({
    providers: {
      $elemMatch: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
  });

  if (existingProviderUser) return existingProviderUser;

  const email = normalizeEmail(profile.email);
  const existingEmailUser = await UserModel.findOne({ email });

  if (existingEmailUser) {
    const hasProvider = existingEmailUser.providers.some(
      (account) => account.provider === provider,
    );

    if (!hasProvider) {
      existingEmailUser.providers.push({
        provider,
        providerAccountId: profile.providerAccountId,
      });
      await existingEmailUser.save();
    }

    return existingEmailUser;
  }

  return UserModel.create({
    name: profile.name,
    email,
    avatarUrl: profile.avatarUrl,
    providers: [{ provider, providerAccountId: profile.providerAccountId }],
  });
}

export const authRouter = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: config.jwtSecret,
      exp: "7d",
      iss: config.appUrl,
      aud: "modern-databases-api",
    }),
  )
  .post(
    "/signup",
    async ({ body, cookie: { session }, jwt, status }) => {
      const email = normalizeEmail(body.email);
      const existingUser = await UserModel.exists({ email });

      if (existingUser) {
        return status(409, {
          success: false,
          error: "An account with this email already exists.",
        });
      }

      const user = await UserModel.create({
        name: body.name.trim(),
        email,
        password: await Bun.password.hash(body.password),
        providers: [],
      });
      const token = await createSession(jwt, user);

      setSessionCookie(session, token);

      return status(201, {
        success: true,
        user: toPublicUser(user),
      });
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 2,
          error: "Name must be at least 2 characters long",
        }),
        email: t.String({ format: "email", error: "Invalid email format" }),
        password: t.String({
          minLength: 8,
          error: "Password must be at least 8 characters long",
        }),
      }),
    },
  )
  .post(
    "/login",
    async ({ body, cookie: { session }, jwt, status }) => {
      const user = await UserModel.findOne({
        email: normalizeEmail(body.email),
      }).select("+password");

      if (
        !user?.password ||
        !(await Bun.password.verify(body.password, user.password))
      ) {
        return status(401, {
          success: false,
          error: "Invalid email or password.",
        });
      }

      const token = await createSession(jwt, user);
      setSessionCookie(session, token);

      return {
        success: true,
        user: toPublicUser(user),
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email", error: "Invalid email format" }),
        password: t.String({ minLength: 1, error: "Password is required" }),
      }),
    },
  )
  .get("/:provider", ({ params, cookie: { oauth_state }, redirect, status }) => {
    if (!isOAuthProvider(params.provider)) {
      return status(404, { success: false, error: "OAuth provider not found." });
    }

    try {
      const state = crypto.randomUUID();
      oauth_state.set({
        value: state,
        httpOnly: true,
        maxAge: OAUTH_STATE_DURATION_SECONDS,
        path: "/auth",
        sameSite: "lax",
        secure: config.isProduction,
      });

      return redirect(createAuthorizationUrl(params.provider, state));
    } catch (error) {
      console.error("Unable to start OAuth login:", error);
      return status(503, {
        success: false,
        error: "OAuth provider is not configured.",
      });
    }
  })
  .get(
    "/:provider/callback",
    async ({ params, query, cookie: { oauth_state, session }, jwt, status }) => {
      if (!isOAuthProvider(params.provider)) {
        return status(404, { success: false, error: "OAuth provider not found." });
      }

      const storedState = oauth_state.value;
      clearCookie(oauth_state);

      if (query.error) {
        return status(400, {
          success: false,
          error: "OAuth login was cancelled or denied.",
        });
      }

      if (
        !query.code ||
        !query.state ||
        typeof storedState !== "string" ||
        storedState !== query.state
      ) {
        return status(400, { success: false, error: "Invalid OAuth state." });
      }

      try {
        const profile = await getOAuthProfile(params.provider, query.code);
        const user = await findOrCreateOAuthUser(params.provider, profile);
        const token = await createSession(jwt, user);

        setSessionCookie(session, token);

        return { success: true, user: toPublicUser(user) };
      } catch (error) {
        console.error("OAuth login failed:", error);
        return status(401, {
          success: false,
          error: "Unable to authenticate with OAuth provider.",
        });
      }
    },
    {
      query: t.Object({
        code: t.Optional(t.String()),
        error: t.Optional(t.String()),
        state: t.Optional(t.String()),
      }),
    },
  )
  .get("/me", async ({ headers, cookie: { session }, jwt, status }) => {
    const token = getSessionToken(headers.authorization, session.value);
    const payload = token ? await jwt.verify(token) : false;

    if (!isSessionPayload(payload)) {
      return status(401, { success: false, error: "Authentication required." });
    }

    const user = await UserModel.findById(payload.sub);

    if (!user) {
      return status(401, { success: false, error: "Authentication required." });
    }

    return { success: true, user: toPublicUser(user) };
  })
  .post("/logout", ({ cookie: { session } }) => {
    session.set({
      value: "",
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: config.isProduction,
    });

    return { success: true };
  })
  .post(
    "/forgot-password",
    async ({ body, status }) => {
      const email = normalizeEmail(body.email);
      const user = await UserModel.findOne({ email }).select(
        "+passwordResetTokenHash +passwordResetExpires",
      );

      // Always respond with success to avoid leaking which emails exist.
      if (!user) {
        return {
          success: true,
          message: "If an account exists, a reset link has been sent.",
        };
      }

      const { token, tokenHash } = createPasswordResetToken();
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpires = new Date(
        Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS,
      );
      await user.save();

      await sendPasswordResetEmail(user.email, user.name, token);

      return {
        success: true,
        message: "If an account exists, a reset link has been sent.",
        ...(!config.isProduction ? { resetToken: token } : {}),
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email", error: "Invalid email format" }),
      }),
    },
  )
  .post(
    "/reset-password",
    async ({ body, cookie: { session }, jwt, status }) => {
      const tokenHash = hashPasswordResetToken(body.token);
      const user = await UserModel.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      }).select("+passwordResetTokenHash +passwordResetExpires");

      if (!user) {
        return status(400, {
          success: false,
          error: "Reset token is invalid or has expired.",
        });
      }

      user.password = await Bun.password.hash(body.password);
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      const token = await createSession(jwt, user);
      setSessionCookie(session, token);

      return {
        success: true,
        user: toPublicUser(user),
      };
    },
    {
      body: t.Object({
        token: t.String({ minLength: 1, error: "Reset token is required" }),
        password: t.String({
          minLength: 8,
          error: "Password must be at least 8 characters long",
        }),
      }),
    },
  );
