import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";
import { AppError } from "../utils/errors";

const extractToken = (headers: Record<string, string | undefined>): string => {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Unauthorized");
  }
  return authHeader.split(" ")[1];
};

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body }) => {
    return await usersService.registerUser(body);
  }, {
    body: t.Object({
      name: t.String({ minLength: 3, maxLength: 255 }),
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
    }),
  })
  .post("/login", async ({ body }) => {
    return await usersService.loginUser(body);
  }, {
    body: t.Object({
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
    }),
  })
  .get("/current", async ({ headers }) => {
    const token = extractToken(headers);
    return await usersService.getCurrentUser(token);
  })
  .delete("/logout", async ({ headers }) => {
    const token = extractToken(headers);
    return await usersService.logoutUser(token);
  });
