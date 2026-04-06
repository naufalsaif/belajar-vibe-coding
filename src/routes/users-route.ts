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
      name: t.String({ minLength: 3, maxLength: 255, default: "John Doe" }),
      email: t.String({ format: "email", maxLength: 255, default: "john@example.com" }),
      password: t.String({ minLength: 6, maxLength: 255, default: "password123" }),
    }),
    response: {
      200: t.Object({
        data: t.String({ default: "OK" }),
      }),
      400: t.Object({
        error: t.String({ default: "Email sudah terdaftar" }),
      }),
      422: t.Object({
        error: t.String({ default: "Validation error" }),
      }),
    },
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
      email: t.String({ format: "email", maxLength: 255, default: "john@example.com" }),
      password: t.String({ minLength: 6, maxLength: 255, default: "password123" }),
    }),
    response: {
      200: t.Object({
        data: t.String({ default: "a968d11e-75d0-4739-99d9-f646e653f87e" }),
      }),
      401: t.Object({
        error: t.String({ default: "Email atau password salah" }),
      }),
    },
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
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number({ default: 1 }),
          name: t.String({ default: "John Doe" }),
          email: t.String({ default: "john@example.com" }),
          createdAt: t.Any({ default: "2024-01-01T00:00:00Z" }),
        }),
      }),
      401: t.Object({
        error: t.String({ default: "Unauthorized" }),
      }),
    },
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
    response: {
      200: t.Object({
        data: t.String({ default: "OK" }),
      }),
      401: t.Object({
        error: t.String({ default: "Unauthorized" }),
      }),
    },
    detail: {
      tags: ["Users"],
      summary: "Logout Pengguna",
      description: "Menghapus sesi aktif berdasarkan token yang diberikan.",
    },
  });
