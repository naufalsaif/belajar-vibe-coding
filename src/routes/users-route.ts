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
  });
