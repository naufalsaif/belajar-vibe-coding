import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoute } from "./routes/users-route";
import { AppError } from "./utils/errors";

export const app = new Elysia()
  .use(swagger({
    path: "/swagger",
    documentation: {
      info: {
        title: "Belajar Vibe Coding API",
        description: "Dokumentasi API untuk sistem autentikasi pengguna menggunakan ElysiaJS dan Drizzle ORM.",
        version: "1.0.0",
      },
      tags: [
        { name: "Users", description: "Endpoint untuk manajemen pengguna dan sesi" },
      ],
    },
  }))
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
