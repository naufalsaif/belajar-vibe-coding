import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("User Authentication API", () => {
  // Database cleanup before each test
  beforeEach(async () => {
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users/ (Registration)", () => {
    it("should register a new user successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Naufal Test",
            email: "test@gmail.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBe("OK");

      // Verify user in DB
      const user = await db.query.users.findFirst({
        where: eq(users.email, "test@gmail.com"),
      });
      expect(user).toBeDefined();
      expect(user?.name).toBe("Naufal Test");
    });

    it("should fail registration with duplicate email", async () => {
      // Register first user
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Naufal 1",
            email: "duplicate@gmail.com",
            password: "password123",
          }),
        })
      );

      // Try duplicate registration
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Naufal 2",
            email: "duplicate@gmail.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Email sudah terdaftar");
    });

    it("should fail on name validation (too short)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "na",
            email: "short@gmail.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail on invalid email format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Naufal",
            email: "bukan-email",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail on password too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Naufal",
            email: "test@gmail.com",
            password: "123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/users/login (Login)", () => {
    it("should login successfully with correct credentials", async () => {
      // Register user
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Naufal Login",
            email: "login@gmail.com",
            password: "password123",
          }),
        })
      );

      // Attempt login
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@gmail.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const { data: token } = await response.json();
      expect(token).toBeDefined();

      // Check session in DB
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
      });
      expect(session).toBeDefined();
    });

    it("should fail login with non-existent email", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "notfound@gmail.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(401);
      const { error } = await response.json();
      expect(error).toBe("Email atau password salah");
    });

    it("should fail login with incorrect password", async () => {
      // Register user
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Naufal Login Fail",
            email: "loginfail@gmail.com",
            password: "password123",
          }),
        })
      );

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "loginfail@gmail.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
    });

    it("should fail on malformed email format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "not-an-email",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("GET /api/users/current (Profile)", () => {
    it("should get current user profile with valid token", async () => {
      // Setup: register and login
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Profile User",
            email: "profile@gmail.com",
            password: "password123",
          }),
        })
      );

      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "profile@gmail.com",
            password: "password123",
          }),
        })
      );
      const { data: token } = await loginResponse.json();

      // Test profile request
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const { data: user } = await response.json();
      expect(user.email).toBe("profile@gmail.com");
      expect(user.password).toBeUndefined(); // Should exclude password
    });

    it("should fail without Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );
      expect(response.status).toBe(401);
    });

    it("should fail with invalid token format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": "Token label-only" },
        })
      );
      expect(response.status).toBe(401);
    });

    it("should fail with non-existent token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": "Bearer random-token-not-in-db" },
        })
      );
      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/users/logout (Logout)", () => {
    it("should logout successfully and delete session", async () => {
      // Setup
      await app.handle(
        new Request("http://localhost/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@gmail.com",
            password: "password123",
          }),
        })
      );
      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@gmail.com",
            password: "password123",
          }),
        })
      );
      const { data: token } = await loginRes.json();

      // Test logout
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data).toBe("OK");

      // Verify session is gone
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
      });
      expect(session).toBeUndefined();

      // Verify subsequent access fails
      const reAccess = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        })
      );
      expect(reAccess.status).toBe(401);
    });

    it("should fail logout with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": "Bearer not-in-db" },
        })
      );
      expect(response.status).toBe(401);
    });

    it("should fail logout without authorization", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(401);
    });
  });
});
