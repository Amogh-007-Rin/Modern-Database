import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { connectDB } from "./db/db";
import { config } from "./lib/config";
import { authRouter } from "./routes/auth/authRouter";

async function startServer(): Promise<void> {
  // Awaiting For Database Connection
  await connectDB();

  const app = new Elysia()
    .use(
      cors({
        origin: config.clientOrigins,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    )
    .use(authRouter)
    .get("/health", () => "Server is running")
    .listen(3000);

  console.log(
    `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

startServer().catch((error: unknown) => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
