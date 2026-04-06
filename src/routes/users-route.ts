import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    const result = await usersService.registerUser(body);

    if (result.error) {
      set.status = 400;
      return { error: result.error };
    }

    return { data: "OK" };
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      password: t.String(),
    }),
  })
  .post("/login", async ({ body, set }) => {
    const result = await usersService.loginUser(body);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return { data: result.data };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  })
  .get("/current", async ({ headers, set }) => {
    const authHeader = headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authHeader.split(" ")[1];
    const result = await usersService.getCurrentUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return { data: result.data };
  })
  .delete("/logout", async ({ headers, set }) => {
    const authHeader = headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authHeader.split(" ")[1];
    const result = await usersService.logoutUser(token);

    if (result.error) {
      set.status = 401;
      return { error: result.error };
    }

    return { data: "OK" };
  });
