import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";
import { AppError } from "./utils/errors";

export const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return { error: error.message };
    }
  })
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok" }))
  .use(usersRoute)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
