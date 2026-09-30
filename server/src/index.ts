import { Elysia } from "elysia";
import { connectDB } from "./db/db";
import { UserModel } from "./db/model";

let counter = 0;

function requestLog(): void {
  counter += 1;
  console.log(`request count: ${counter}`);
}

function hello(): string {
  requestLog();
  return "Hello";
}


async function createUser() {
  const user = await UserModel.create({
    name: "Random",
    // Email is unique in the schema, so every demonstration request needs a
    // distinct value instead of reusing one that fails after the first call.
    email: `random-${crypto.randomUUID()}@example.com`
  });

  console.log("User created successfully:", user);

  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}



async function startServer(): Promise<void> {
  await connectDB();

  const app = new Elysia()
    .get("/", () => "Hello Elysia")
    .get("/hello", hello)
    .get("/user", createUser)
    .listen(3000);

  console.log(
    `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`
  );
}

startServer().catch((error: unknown) => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
