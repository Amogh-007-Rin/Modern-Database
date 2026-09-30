import "./env";

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be configured before starting the server.`);
  }

  return value;
}

const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Origins allowed to call the API from a browser (cookie auth needs an
// explicit origin, never "*"). Comma-separated via CLIENT_URL, e.g.
// "http://localhost:5173,https://app.example.com".
const clientOrigins = (process.env.CLIENT_URL ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter((origin) => origin.length > 0);

export const config = {
  appUrl,
  clientOrigins,
  // Base URL used to build links sent to users (password reset emails).
  webUrl: (process.env.WEB_URL ?? clientOrigins[0] ?? appUrl).replace(
    /\/$/,
    "",
  ),
  connectionString: getRequiredEnvironmentVariable("DATABASE_URL"),
  isProduction: process.env.NODE_ENV === "production",
  jwtSecret: getRequiredEnvironmentVariable("JWT_SECRET"),
};
