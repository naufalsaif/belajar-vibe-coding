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
    detail: {
      tags: ["Users"],
      summary: "Registrasi Pengguna Baru",
      description: "Mendaftarkan akun baru dengan validasi nama, email, dan password.",
    },
  })
  .post("/login", async ({ body }) => {
    return await usersService.loginUser(body);
  }, {
    body: t.Object({
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
    }),
    detail: {
      tags: ["Users"],
      summary: "Login Pengguna",
      description: "Melakukan otentikasi dan mendapatkan token sesi.",
    },
  })
  .get("/current", async ({ headers }) => {
    const token = extractToken(headers);
    return await usersService.getCurrentUser(token);
  }, {
    detail: {
      tags: ["Users"],
      summary: "Profil Pengguna Aktif",
      description: "Mendapatkan profil pengguna berdasarkan token Bearer yang valid.",
    },
  })
  .delete("/logout", async ({ headers }) => {
    const token = extractToken(headers);
    return await usersService.logoutUser(token);
  }, {
    detail: {
      tags: ["Users"],
      summary: "Logout Pengguna",
      description: "Menghapus sesi aktif berdasarkan token yang diberikan.",
    },
  });
